import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWriteClient } from '@/lib/sanity/client';

const RegistrationSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(1).max(50),
  country: z.string().trim().min(1).max(100),
  organization: z.string().trim().max(200).optional().default(''),
  category: z.enum(['visitor', 'participant', 'volunteer']),
  track: z.string().trim().max(200),
});

function generateCode(name: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = Date.now();
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x9e3779b9) >>> 0;
  let code = '';
  for (let i = 0; i < 6; i++) { code += chars[h % chars.length]; h = Math.imul(h, 0x5bd1e995) >>> 0; }
  return `CICT-2026-${code}`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = RegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid registration data' }, { status: 400 });
  }

  const fields = parsed.data;
  const confirmationCode = generateCode(fields.fullName);

  try {
    await getWriteClient().create({
      _type: 'registration',
      ...fields,
      confirmationCode,
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to store registration:', err);
    return NextResponse.json({ ok: false, error: 'Could not save registration, please try again' }, { status: 502 });
  }

  return NextResponse.json({ ok: true, code: confirmationCode });
}
