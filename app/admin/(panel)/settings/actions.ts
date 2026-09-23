'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { cleanEmail, cleanUrl, SETTINGS_ID } from '@/lib/site-settings';
import { emailConfigured, isDeliverable, sendEmail } from '@/lib/email';
import { testEmail } from '@/lib/account-emails';

type ActionResult = { error?: string; success?: string } | void;

const UNAUTHORIZED = 'غير مصرح لك بهذا الإجراء';

/**
 * Save the site-wide settings.
 *
 * Empty is a real answer here, and means "use the shipped default" rather than
 * "leave it as it was" — which is why every field is written on every save,
 * including the blank ones. An organizer who clears the X link and saves has
 * said something, and the form must not quietly keep the old value.
 *
 * Links are cleaned rather than trusted. The footer renders these into `href`
 * on every public page, so a `javascript:` URL pasted here would be script on
 * the whole site; cleanUrl admits http and https and nothing else.
 */
export async function saveSiteSettings(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };

  const raw = (name: string) => String(formData.get(name) || '').trim();

  const contactEmailInput = raw('contactEmail');
  const contactEmail = cleanEmail(contactEmailInput);
  if (contactEmailInput && !contactEmail) {
    return { error: 'البريد الإلكتروني غير صالح' };
  }

  // Reported by name, so "one of your links was dropped" is never the message.
  const links: Array<[string, string]> = [
    ['facebookUrl', 'رابط فيسبوك'],
    ['instagramUrl', 'رابط إنستغرام'],
    ['youtubeUrl', 'رابط يوتيوب'],
    ['xUrl', 'رابط X'],
  ];
  const cleaned: Record<string, string> = {};
  for (const [field, label] of links) {
    const input = raw(field);
    const value = cleanUrl(input);
    if (input && !value) {
      return { error: `${label} غير صالح — يجب أن يبدأ بـ https://` };
    }
    cleaned[field] = value;
  }

  const registrationOpen = formData.get('registrationOpen') === 'on';
  const registrationClosedNote = raw('registrationClosedNote');

  const data = {
    contactEmail: contactEmail || null,
    facebookUrl: cleaned.facebookUrl || null,
    instagramUrl: cleaned.instagramUrl || null,
    youtubeUrl: cleaned.youtubeUrl || null,
    xUrl: cleaned.xUrl || null,
    registrationOpen,
    registrationClosedNote: registrationClosedNote || null,
  };

  await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data,
  });

  // Every public page renders the footer, and the registration gate is read by
  // the form and the route. `layout` scope so the footer is rebuilt too — a
  // page-scoped revalidate would leave the old links in place everywhere.
  revalidatePath('/', 'layout');
  revalidatePath('/admin/settings');

  return { success: 'تم حفظ الإعدادات' };
}

/**
 * Prove the mail setup works, by sending one.
 *
 * "Is mail configured" and "does mail arrive" are different questions, and only
 * the second matters. A key can be present and wrong; a from-address can sit on
 * a domain the provider has never been shown. Both look identical from inside
 * the platform until something is actually sent — which is why this exists as a
 * button rather than as a green tick beside an environment variable.
 *
 * The result is reported verbatim, including the provider's own refusal, since
 * that text is what says which DNS record is missing.
 */
export async function sendTestEmail(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: 'غير مصرح لك بتغيير الإعدادات' };

  const to = String(formData.get('testEmail') ?? '').trim();
  if (!to) return { error: 'اكتب البريد الذي تريد الاختبار عليه' };
  if (!isDeliverable(to)) return { error: 'هذا العنوان لا يصلح للإرسال إليه' };

  if (!emailConfigured()) {
    return { error: 'البريد غير مفعّل — أضف RESEND_API_KEY و EMAIL_FROM في إعدادات Vercel' };
  }

  const result = await sendEmail({ to, ...testEmail({ to, sentBy: admin.email }) });

  if (result.ok) return { success: `أُرسلت رسالة اختبار إلى ${to} — تحقق من الوارد والبريد المزعج` };

  return {
    error: result.reason === 'rejected'
      ? `رفض المزوّد الإرسال (${result.detail ?? 'خطأ'}) — غالباً النطاق في EMAIL_FROM غير مُوثَّق في Resend`
      : 'تعذّر الإرسال',
  };
}
