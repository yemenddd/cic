import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { generateConfirmationCode, isCodeCollision } from '@/lib/confirmation-code';
import {
  REGISTER_BY_IP, REGISTER_REJECTED_BY_IP, clientIp, recordFailure, throttleState,
} from '@/lib/rate-limit';
import { MIN_PASSWORD_LENGTH } from '@/lib/password-rules';
import { initialStatus, needsApproval } from '@/lib/account-status';
import { canonicalTrack } from '@/lib/submissions';
import { getSiteSettings } from '@/lib/site-settings-server';

const RegistrationSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(1).max(50),
  country: z.string().trim().min(1).max(100),
  organization: z.string().trim().max(200).optional().default(''),
  category: z.enum(['visitor', 'participant', 'volunteer']),
  // Accepted in any of the three languages the form is offered in, and stored
  // in the canonical Arabic. The form posts the label the visitor saw, so
  // validating against the Arabic list alone would have refused every English
  // and Turkish registration — and storing the label as sent is what put
  // "Innovation & Technology" on an Arabic certificate.
  //
  // Empty passes: the track is optional. Anything outside the twelve does not,
  // because it is printed on a certificate and the account page has refused
  // invented values since it was written.
  track: z.string().trim().max(200)
    .refine((t) => canonicalTrack(t) !== null, { message: 'المسار غير صالح' })
    .transform((t) => canonicalTrack(t)!),
  // The same minimum the rest of the platform enforces. It was eight here and
  // ten everywhere else, so somebody could register with a password they were
  // then not allowed to choose again when changing it.
  password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
});

export async function POST(req: Request) {
  // Checked here, not only in the form. Hiding the fields closes the door for
  // anyone using the page and for nobody else — the route is a public endpoint
  // and a closed registration that still accepts a posted body is open.
  //
  // Before the throttle so a shut form costs nothing to refuse, and returns
  // 403 rather than 429: this is not "too many", it is "not now".
  const settings = await getSiteSettings();
  if (!settings.registrationOpen) {
    return NextResponse.json(
      { ok: false, error: settings.registrationClosedNote },
      { status: 403 },
    );
  }

  // Anyone can post here, and every accepted call costs a bcrypt hash and a
  // permanent row. Without a ceiling, one script fills the attendee list with
  // thousands of invented people and the real registrations are lost in them.
  const ip = clientIp(req.headers);

  /** Counted only when a request is turned away — see lib/rate-limit.ts. */
  const reject = async (body: Record<string, unknown>, status: number) => {
    if (ip) await recordFailure('register:rejected', ip, REGISTER_REJECTED_BY_IP);
    return NextResponse.json(body, { status });
  };

  if (ip) {
    // Two separate ceilings. A busy desk trips neither; somebody probing the
    // endpoint trips the first long before the second.
    for (const scope of ['register:rejected', 'register:ip'] as const) {
      const state = await throttleState(scope, ip);
      if (state.blocked) {
        return NextResponse.json(
          { ok: false, error: 'محاولات تسجيل كثيرة — حاول مرة أخرى بعد قليل' },
          { status: 429, headers: { 'Retry-After': String(state.retryAfter) } },
        );
      }
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return reject({ ok: false, error: 'Invalid request body' }, 400);
  }

  const parsed = RegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return reject({ ok: false, error: 'بيانات التسجيل غير صالحة' }, 400);
  }

  const { password, ...fields } = parsed.data;
  const email = fields.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return reject(
      { ok: false, error: 'هذا البريد مسجَّل بالفعل — سجّل الدخول بدلاً من ذلك' },
      409,
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Codes are random, so a clash is vanishingly unlikely — but the column is
  // unique, and a signup must never fail over a dice roll. Retry, then give up
  // rather than loop forever against a genuinely broken database.
  for (let attempt = 0; attempt < 5; attempt++) {
    const confirmationCode = generateConfirmationCode();

    try {
      // The account and its registration record are created together: a user
      // without a registration (or the reverse) would be a broken half-signup.
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: fields.fullName,
          role: 'ATTENDEE',
          phone: fields.phone,
          country: fields.country,
          organization: fields.organization || null,
          category: fields.category,
          track: fields.track,
          // Participants and volunteers wait for the committee; a visitor is
          // admitted on the spot. Decided from the category by one function so
          // the rule cannot differ between here and the screen that tells them.
          status: initialStatus(fields.category),
          confirmationCode,
          registrations: {
            create: { ...fields, email, confirmationCode },
          },
        },
      });

      // Counted only now, against the generous ceiling: a completed signup is
      // not an attack signal, it is the thing this endpoint is for.
      if (ip) await recordFailure('register:ip', ip, REGISTER_BY_IP);

      // The client signs in straight after registering, which now fails for a
      // category that waits — so it is told here, rather than discovering it
      // as a mysterious sign-in error one screen later.
      return NextResponse.json({
        ok: true,
        code: confirmationCode,
        pending: needsApproval(fields.category),
      });
    } catch (err) {
      // P2002 is Prisma's unique-constraint violation. On confirmationCode it
      // means "draw another code"; on email it means someone registered in the
      // moment between the check above and this write, and retrying would only
      // fail the same way.
      if (isCodeCollision(err)) continue;

      if ((err as { code?: string }).code === 'P2002') {
        return reject(
          { ok: false, error: 'هذا البريد مسجَّل بالفعل — سجّل الدخول بدلاً من ذلك' },
          409,
        );
      }

      console.error('Failed to store registration:', err);
      return NextResponse.json(
        { ok: false, error: 'تعذّر حفظ التسجيل، حاول مرة أخرى' },
        { status: 502 },
      );
    }
  }

  console.error('Gave up generating a unique confirmation code for', email);
  return NextResponse.json(
    { ok: false, error: 'تعذّر حفظ التسجيل، حاول مرة أخرى' },
    { status: 502 },
  );
}
