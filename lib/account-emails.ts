import { siteUrl } from '@/lib/site';

/**
 * What the committee's decision says when it arrives by mail.
 *
 * The in-app notification was the whole of it, and for a refusal that is a
 * message delivered inside the one place its recipient can no longer open. For
 * an approval it is barely better: somebody waiting to be let in has no reason
 * to keep checking a platform that has been refusing them.
 *
 * Plain text on purpose. These are short, they are transactional, and an HTML
 * mail that renders badly in a mail client somebody reads on a bus is worse
 * than two paragraphs that always render.
 *
 * Pure — no provider, no database — so the wording can be checked.
 */

export interface DecisionEmail {
  subject: string;
  text: string;
}

const SIGN_OFF = 'فريق تنظيم مؤتمر الإبداع والابتكار';

function greeting(name: string | null | undefined): string {
  const first = (name ?? '').trim().split(/\s+/)[0];
  return first ? `مرحباً ${first}،` : 'مرحباً،';
}

export function approvalEmail(params: {
  name: string | null;
  categoryLabel: string;
}): DecisionEmail {
  const role = params.categoryLabel || 'مشارك';

  return {
    subject: 'تم قبول طلب انضمامك — مؤتمر الإبداع والابتكار',
    text: [
      greeting(params.name),
      '',
      `قُبل طلب انضمامك إلى مؤتمر الإبداع والابتكار بصفة ${role}.`,
      '',
      'يمكنك الآن الدخول إلى حسابك:',
      `${siteUrl}/login`,
      '',
      // The badge is the thing they actually need on the day, and the thing
      // they will look for; saying where it lives now saves a message later.
      'من حسابك تجد بطاقة الدخول برمزها، وجدول المؤتمر، وشهادتك بعد انتهاء الفعاليات.',
      '',
      'نراك في المؤتمر،',
      SIGN_OFF,
    ].join('\n'),
  };
}

export function rejectionEmail(params: {
  name: string | null;
  reason: string;
}): DecisionEmail {
  const reason = params.reason.trim();

  return {
    subject: 'بخصوص طلب انضمامك — مؤتمر الإبداع والابتكار',
    text: [
      greeting(params.name),
      '',
      'نشكرك على اهتمامك بمؤتمر الإبداع والابتكار.',
      '',
      // The reason is the message. A refusal without one generates a reply
      // asking why, which somebody then has to answer by hand.
      'بعد مراجعة طلبك، لم يُقبل للأسباب التالية:',
      reason,
      '',
      'إن كان لديك استفسار أو رأيت أن هناك ما يستدعي إعادة النظر، تواصل معنا بالرد على هذه الرسالة.',
      '',
      'مع التقدير،',
      SIGN_OFF,
    ].join('\n'),
  };
}

/**
 * The message the organizers send to themselves to prove the setup works.
 *
 * Exists because "is mail configured" and "does mail actually arrive" are
 * different questions, and only the second one matters. A key can be present
 * and wrong, a domain can be unverified, a from-address can belong to a domain
 * the provider has never heard of — all of which look identical from inside
 * the platform until something is actually sent.
 */
export function testEmail(params: { to: string; sentBy: string }): DecisionEmail {
  return {
    subject: 'اختبار البريد — منصة الإبداع والابتكار',
    text: [
      'وصلت هذه الرسالة، إذن إعدادات البريد سليمة.',
      '',
      `أرسلها: ${params.sentBy}`,
      `إلى: ${params.to}`,
      `في: ${new Date().toISOString()}`,
      '',
      'من الآن تصل رسائل قبول ورفض طلبات الانضمام، وروابط استعادة كلمة المرور،',
      'إلى بريد أصحابها بدل أن تبقى داخل المنصة وحدها.',
      '',
      SIGN_OFF,
    ].join('\n'),
  };
}
