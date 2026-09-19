import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { generateConfirmationCode, isCodeCollision } from '@/lib/confirmation-code';
import { REGISTER_BY_IP, clientIp, recordFailure, throttleState } from '@/lib/rate-limit';

const RegistrationSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(1).max(50),
  country: z.string().trim().min(1).max(100),
  organization: z.string().trim().max(200).optional().default(''),
  category: z.enum(['visitor', 'participant', 'volunteer']),
  track: z.string().trim().max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  // Anyone can post here, and every accepted call costs a bcrypt hash and a
  // permanent row. Without a ceiling, one script fills the attendee list with
  // thousands of invented people and the real registrations are lost in them.
  const ip = clientIp(req.headers);
  if (ip) {
    const state = await throttleState('register:ip', ip);
    if (state.blocked) {
      return NextResponse.json(
        { ok: false, error: 'محاولات تسجيل كثيرة — حاول مرة أخرى بعد قليل' },
        { status: 429, headers: { 'Retry-After': String(state.retryAfter) } },
      );
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = RegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'بيانات التسجيل غير صالحة' }, { status: 400 });
  }

  // Counted before the work is done, so a malformed flood is limited too.
  if (ip) await recordFailure('register:ip', ip, REGISTER_BY_IP);

  const { password, ...fields } = parsed.data;
  const email = fields.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: 'هذا البريد مسجَّل بالفعل — سجّل الدخول بدلاً من ذلك' },
      { status: 409 },
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
          confirmationCode,
          registrations: {
            create: { ...fields, email, confirmationCode },
          },
        },
      });

      return NextResponse.json({ ok: true, code: confirmationCode });
    } catch (err) {
      // P2002 is Prisma's unique-constraint violation. On confirmationCode it
      // means "draw another code"; on email it means someone registered in the
      // moment between the check above and this write, and retrying would only
      // fail the same way.
      if (isCodeCollision(err)) continue;

      if ((err as { code?: string }).code === 'P2002') {
        return NextResponse.json(
          { ok: false, error: 'هذا البريد مسجَّل بالفعل — سجّل الدخول بدلاً من ذلك' },
          { status: 409 },
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
