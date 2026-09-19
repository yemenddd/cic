'use server';

import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { CATEGORIES, categoryLabel } from '@/lib/categories';
import { generateConfirmationCode, isCodeCollision } from '@/lib/confirmation-code';
import { SUBMISSION_TRACKS } from '@/lib/submissions';

type ActionResult = { error?: string; success?: string };
// resetUserPassword is the one action that hands something back: the generated
// password only ever exists in this response, never in the database.
type ResetResult = ActionResult & { password?: string };
/** Everything an organizer needs to read out to somebody standing at the desk. */
type CreateResult = ActionResult & {
  password?: string;
  email?: string;
  code?: string;
  userId?: string;
};

// A Server Action is a POST to whatever route it shipped with — the panel
// layout guards the /admin pages, but the action itself is a separate entry
// point and must re-check on every call. `requireAdmin` resolves the role from
// the database rather than the (stale) JWT; see lib/auth-guards.ts.

// Demoting or deleting the only ADMIN would leave the platform with nobody
// able to sign in to /admin, and no in-app way back — there is no self-serve
// promotion path. Every such call is refused before it reaches the database.
async function isLastAdmin(userId: string): Promise<boolean> {
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (target?.role !== 'ADMIN') return false;
  return (await prisma.user.count({ where: { role: 'ADMIN' } })) <= 1;
}

// No 0/O/1/l/I — the admin reads this password out loud or pastes it into a
// message, and an ambiguous glyph turns into a support ticket.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const PASSWORD_LENGTH = 16;

function generatePassword(): string {
  const size = PASSWORD_ALPHABET.length;
  // 256 is not a multiple of the alphabet size, so bytes at or above the
  // cutoff are discarded rather than folded in with `%` — otherwise the first
  // few characters of the alphabet would come up measurably more often.
  const cutoff = Math.floor(256 / size) * size;

  let password = '';
  while (password.length < PASSWORD_LENGTH) {
    for (const byte of randomBytes(PASSWORD_LENGTH)) {
      if (byte >= cutoff) continue;
      password += PASSWORD_ALPHABET[byte % size];
      if (password.length === PASSWORD_LENGTH) break;
    }
  }
  return password;
}

function field(form: FormData, name: string, max = 200): string {
  return String(form.get(name) ?? '').trim().slice(0, max);
}

/** Revalidate everything a change to one account can be visible in. */
function revalidateUser(userId?: string) {
  revalidatePath('/admin/users');
  revalidatePath('/admin');
  if (userId) revalidatePath(`/admin/users/${userId}`);
}

export async function resetUserPassword(userId: string): Promise<ResetResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة المستخدمين' };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { error: 'المستخدم غير موجود' };

  const password = generatePassword();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password, 12) },
  });

  revalidatePath(`/admin/users/${userId}`);

  // The plaintext is returned exactly once. It is not stored anywhere, so if
  // the admin loses it the only way forward is another reset.
  return { success: 'تم إنشاء كلمة مرور جديدة', password };
}

export async function setUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة المستخدمين' };

  if (role !== 'ADMIN' && role !== 'ATTENDEE') return { error: 'الصلاحية غير صالحة' };

  if (role === 'ATTENDEE' && (await isLastAdmin(userId))) {
    return { error: 'لا يمكن تنزيل آخر مدير في المنصة — عيّن مديراً آخر أولاً' };
  }

  const { count } = await prisma.user.updateMany({ where: { id: userId }, data: { role } });
  if (count === 0) return { error: 'المستخدم غير موجود' };

  revalidateUser(userId);

  return { success: role === 'ADMIN' ? 'تمت ترقية المستخدم إلى مدير' : 'تم تحويل المستخدم إلى مشارك' };
}

/**
 * Change which benefit tier an attendee belongs to.
 *
 * Presenting a project is participant-only, and the category is fixed at
 * registration — so without this, someone who picked the wrong tier at signup
 * would have no way back. An admin is that way back.
 */
export async function setUserCategory(userId: string, category: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة المستخدمين' };

  // Validate against the shared list rather than trusting the posted value —
  // an unknown category would silently strip every benefit.
  if (!CATEGORIES.some((c) => c.id === category)) return { error: 'الفئة غير صالحة' };

  const { count } = await prisma.user.updateMany({ where: { id: userId }, data: { category } });
  if (count === 0) return { error: 'المستخدم غير موجود' };

  revalidateUser(userId);
  revalidatePath('/dashboard');

  return { success: `تم تغيير الفئة إلى «${categoryLabel(category, 'ar')}»` };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: 'غير مصرح لك بإدارة المستخدمين' };

  if (admin.id === userId) {
    return { error: 'لا يمكنك حذف حسابك الحالي وأنت مسجّل الدخول به' };
  }

  if (await isLastAdmin(userId)) {
    return { error: 'لا يمكن حذف آخر مدير في المنصة — عيّن مديراً آخر أولاً' };
  }

  const { count } = await prisma.user.deleteMany({ where: { id: userId } });
  if (count === 0) return { error: 'المستخدم غير موجود' };

  revalidatePath('/admin/users');
  redirect('/admin/users');
}

/**
 * Issue (or re-issue) the code printed on a badge.
 *
 * Accounts created before codes existed have none, and their badge renders
 * with an empty QR — which is a person who cannot be scanned in at the door.
 * Re-issuing also invalidates a code that leaked, at the cost of every printed
 * copy of the old one.
 */
export async function regenerateConfirmationCode(userId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة المستخدمين' };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { error: 'المستخدم غير موجود' };

  // Codes are random, so a clash is vanishingly unlikely — but the column is
  // unique, and this must not fail over a dice roll.
  for (let attempt = 0; attempt < 5; attempt++) {
    const confirmationCode = generateConfirmationCode();
    try {
      await prisma.user.update({ where: { id: userId }, data: { confirmationCode } });
      revalidateUser(userId);
      revalidatePath('/dashboard/badge');
      return { success: `رمز التأكيد الجديد: ${confirmationCode}` };
    } catch (err) {
      if (isCodeCollision(err)) continue;
      throw err;
    }
  }

  return { error: 'تعذّر إصدار رمز جديد، حاول مرة أخرى' };
}

/**
 * Create an account from inside the panel.
 *
 * The registration form on the public site is the normal way in, but it is not
 * the only one: people arrive at the desk having never registered, and the
 * alternative to this form is an organizer filling in the public form on the
 * attendee's behalf and inventing a password for them. This does the same job
 * without the pretence, and hands back a generated password the organizer can
 * read out once.
 */
export async function createUser(_prev: CreateResult | undefined, form: FormData): Promise<CreateResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة المستخدمين' };

  const email = field(form, 'email').toLowerCase();
  const name = field(form, 'name');
  const category = field(form, 'category', 40);
  const role = field(form, 'role', 20) === 'ADMIN' ? 'ADMIN' : 'ATTENDEE';

  if (!name) return { error: 'الاسم مطلوب' };
  // Deliberately the same shape the public form accepts, no stricter: an
  // address this refuses but the registration route accepts would mean an
  // attendee the desk cannot re-create.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'البريد الإلكتروني غير صالح' };
  if (!CATEGORIES.some((c) => c.id === category)) return { error: 'الفئة غير صالحة' };

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: 'هذا البريد مسجَّل بالفعل' };
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const profile = {
    phone: field(form, 'phone', 50) || null,
    country: field(form, 'country', 100) || null,
    organization: field(form, 'organization') || null,
    track: field(form, 'track') || null,
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    const confirmationCode = generateConfirmationCode();
    try {
      // Account and registration row together — the public route creates both,
      // and a desk signup that produced only one would be missing from the
      // registrations list the organizers actually count from.
      const created = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
          category,
          confirmationCode,
          ...profile,
          registrations: {
            create: {
              fullName: name,
              email,
              category,
              confirmationCode,
              phone: profile.phone,
              country: profile.country,
              organization: profile.organization,
              track: profile.track,
            },
          },
        },
        select: { id: true },
      });

      revalidateUser(created.id);
      revalidatePath('/admin/registrations');

      return {
        success: 'تم إنشاء الحساب',
        password,
        email,
        code: confirmationCode,
        userId: created.id,
      };
    } catch (err) {
      if (isCodeCollision(err)) continue;
      if ((err as { code?: string }).code === 'P2002') {
        return { error: 'هذا البريد مسجَّل بالفعل' };
      }
      throw err;
    }
  }

  return { error: 'تعذّر إنشاء الحساب، حاول مرة أخرى' };
}

/**
 * Correct the profile behind a badge.
 *
 * The name and organization on this record are printed on the badge and the
 * certificate, so a typo made at registration is not cosmetic — it is a
 * document with the wrong name on it. The attendee can fix some of it from
 * their own account; an organizer at the desk can fix all of it here.
 */
export async function updateUserProfile(
  _prev: ActionResult | undefined,
  form: FormData,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة المستخدمين' };

  const userId = field(form, 'userId', 64);
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, track: true },
  });
  if (!current) return { error: 'المستخدم غير موجود' };

  const name = field(form, 'name');
  const email = field(form, 'email').toLowerCase();
  const category = field(form, 'category', 40);
  const track = field(form, 'track');

  if (!name) return { error: 'الاسم مطلوب' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'البريد الإلكتروني غير صالح' };
  if (category && !CATEGORIES.some((c) => c.id === category)) return { error: 'الفئة غير صالحة' };
  // The track is printed on the certificate, so it comes from the offered list
  // — except for a value this account already holds, which predates the list
  // and must not be silently dropped by an unrelated edit.
  if (track && !SUBMISSION_TRACKS.includes(track) && track !== current.track) {
    return { error: 'المسار غير صالح' };
  }

  if (email !== current.email) {
    const clash = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (clash) return { error: 'هذا البريد مستخدم في حساب آخر' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      category: category || null,
      track: track || null,
      phone: field(form, 'phone', 50) || null,
      country: field(form, 'country', 100) || null,
      organization: field(form, 'organization') || null,
    },
  });

  revalidateUser(userId);
  revalidatePath('/dashboard');

  return { success: 'تم حفظ البيانات' };
}

// ─── acting on a selection ───────────────────────────────────────────────────

/** Guards shared by every bulk action. */
const MAX_BULK = 500;

function validIds(userIds: string[]): string[] {
  // Deduplicated, bounded, and free of anything that is not an id — a bulk
  // action is the one place where a malformed list could touch hundreds of
  // rows before anyone notices.
  return [...new Set(userIds)].filter((id) => /^[A-Za-z0-9_-]{1,64}$/.test(id)).slice(0, MAX_BULK);
}

export async function bulkSetCategory(userIds: string[], category: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة المستخدمين' };
  if (!CATEGORIES.some((c) => c.id === category)) return { error: 'الفئة غير صالحة' };

  const ids = validIds(userIds);
  if (ids.length === 0) return { error: 'لم تحدد أي مستخدم' };

  const { count } = await prisma.user.updateMany({ where: { id: { in: ids } }, data: { category } });

  revalidateUser();
  revalidatePath('/dashboard');

  return { success: `تم تغيير فئة ${count} مستخدماً إلى «${categoryLabel(category, 'ar')}»` };
}

export async function bulkDeleteUsers(userIds: string[]): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: 'غير مصرح لك بإدارة المستخدمين' };

  const ids = validIds(userIds);
  if (ids.length === 0) return { error: 'لم تحدد أي مستخدم' };

  if (ids.includes(admin.id)) {
    return { error: 'حسابك الحالي ضمن التحديد — أزِله قبل الحذف' };
  }

  // The last-admin rule has to be evaluated over the whole selection, not one
  // row at a time: deleting two of the three admins is fine, deleting all
  // three locks everybody out of the panel for good.
  const [selectedAdmins, totalAdmins] = await Promise.all([
    prisma.user.count({ where: { id: { in: ids }, role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
  ]);
  if (selectedAdmins > 0 && totalAdmins - selectedAdmins < 1) {
    return { error: 'التحديد يشمل كل المديرين — أبقِ مديراً واحداً على الأقل' };
  }

  const { count } = await prisma.user.deleteMany({ where: { id: { in: ids } } });

  revalidateUser();

  return { success: `تم حذف ${count} مستخدماً` };
}
