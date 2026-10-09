import { siteUrl } from '@/lib/site';
import { QR_CID, renderHtml, renderText, type EmailContent } from '@/lib/email-template';
import { qrPng } from '@/lib/qr-png';

/**
 * What the committee's decision says when it arrives by mail.
 *
 * The in-app notification was the whole of it, and for a refusal that is a
 * message delivered inside the one place its recipient can no longer open. For
 * an approval it is barely better: somebody waiting to be let in has no reason
 * to keep checking a platform that has been refusing them.
 *
 * Each message is written once as content — a title, some paragraphs, maybe a
 * button — and lib/email-template.ts renders it twice, as HTML and as plain
 * text. Keeping the two in one place is what stops them drifting apart, which
 * is the usual fate of a text alternative maintained by hand.
 *
 * Pure — no provider, no database — so the wording can be checked.
 */

export interface DecisionEmail {
  subject: string;
  text: string;
  html: string;
  /** Files that must travel with it — the badge QR, when there is one. */
  attachments?: Array<{ filename: string; content: Buffer; contentId?: string }>;
}

function greeting(name: string | null | undefined): string {
  const first = (name ?? '').trim().split(/\s+/)[0];
  return first ? `مرحباً ${first}،` : 'مرحباً،';
}

function build(
  subject: string,
  content: EmailContent,
  attachments?: DecisionEmail['attachments'],
): DecisionEmail {
  return { subject, text: renderText(content), html: renderHtml(content), ...(attachments ? { attachments } : {}) };
}

export function approvalEmail(params: {
  name: string | null;
  categoryLabel: string;
}): DecisionEmail {
  const role = params.categoryLabel || 'مشارك';

  return build('تم قبول طلب انضمامك — مؤتمر الإبداع والابتكار', {
    greeting: greeting(params.name),
    title: 'تم قبول طلب انضمامك',
    paragraphs: [
      `قُبل طلب انضمامك إلى منصة مؤتمر الإبداع والابتكار بصفة ${role}. يمكنك الآن الدخول إلى حسابك.`,
      // The badge is the thing they will look for; saying where it lives
      // now saves a message later.
      'من حسابك تجد بطاقة الدخول برمزها، وشهادتك، وما تقدّمه من أعمال.',
    ],
    button: { label: 'الدخول إلى حسابي', href: `${siteUrl}/login` },
    note: 'احتفظ ببطاقتك على هاتفك — يُمسح رمزها عند بوابة فعاليات المؤتمر.',
  });
}

export function rejectionEmail(params: {
  name: string | null;
  reason: string;
}): DecisionEmail {
  return build('بخصوص طلب انضمامك — مؤتمر الإبداع والابتكار', {
    greeting: greeting(params.name),
    title: 'بخصوص طلب انضمامك',
    paragraphs: ['نشكرك على اهتمامك بمؤتمر الإبداع والابتكار، وعلى الوقت الذي منحته للتسجيل.'],
    // The reason is the message. A refusal without one generates a reply
    // asking why, which somebody then has to answer by hand.
    callout: { label: 'سبب عدم القبول', body: params.reason.trim() },
    note: 'إن كان لديك استفسار أو رأيت أن هناك ما يستدعي إعادة النظر، تواصل معنا بالرد على هذه الرسالة.',
  });
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
  return build('اختبار البريد — منصة الإبداع والابتكار', {
    title: 'وصلت هذه الرسالة، إذن البريد يعمل',
    paragraphs: [
      'من الآن تصل رسائل قبول ورفض طلبات الانضمام، وروابط استعادة كلمة المرور، إلى بريد أصحابها بدل أن تبقى داخل المنصة وحدها.',
    ],
    // Rows rather than one block of text: an address is Latin inside a
    // right-to-left line, and run together they reorder so the colon lands on
    // the wrong side of the value.
    callout: {
      label: 'تفاصيل الإرسال',
      rows: [
        { k: 'أرسلها', v: params.sentBy },
        { k: 'إلى', v: params.to },
        { k: 'في', v: new Date().toLocaleString('ar', { dateStyle: 'full', timeStyle: 'short' }) },
      ],
    },
    button: { label: 'فتح لوحة التحكم', href: `${siteUrl}/admin` },
  });
}

/**
 * The first message somebody gets, the moment they register.
 *
 * Two versions of one email, because registration ends in two different
 * places. A visitor is admitted on the spot and can sign in immediately; a
 * volunteer is waiting on the committee, and telling them to "log in now"
 * would send them to a door that refuses them. The difference is the whole
 * point of the message, so it is decided here rather than left to a caller to
 * remember.
 *
 * The confirmation code is in both: it is what they are asked for at the door,
 * and this mail is the copy of it they will still have when the tab is closed.
 */
export function welcomeEmail(params: {
  name: string | null;
  categoryLabel: string;
  code: string;
  pending: boolean;
  /** The signed token the door scanner reads. */
  badgeToken?: string;
}): DecisionEmail {
  const role = params.categoryLabel || 'مشارك';

  const badge = {
    name: (params.name ?? '').trim() || 'ضيف المؤتمر',
    categoryLabel: role,
    code: params.code,
    token: params.badgeToken,
  };

  // Rendered here and carried with the message, so the card in the mail needs
  // nothing from the network to be scannable.
  const attachments = params.badgeToken
    ? [{
        filename: `${params.code}.png`,
        content: qrPng(params.badgeToken, { correction: 'Q', scale: 8, margin: 3 }),
        contentId: QR_CID,
      }]
    : undefined;

  if (params.pending) {
    return build('استلمنا تسجيلك — مؤتمر الإبداع والابتكار', {
      greeting: greeting(params.name),
      title: 'استلمنا تسجيلك',
      paragraphs: [
        `وصلنا طلب انضمامك إلى مؤتمر الإبداع والابتكار بصفة ${role}، وهو الآن قيد المراجعة لدى اللجنة المنظِّمة.`,
        'ستصلك رسالة على هذا البريد فور صدور القرار. لا حاجة لأي خطوة من جانبك حتى ذلك الحين.',
      ],
      badge,
      note: 'بطاقتك أعلاه صالحة بمجرد صدور القرار — احتفظ بها، فهي ما يُمسح عند بوابة الفعاليات.',
    }, attachments);
  }

  return build('أهلاً بك في مؤتمر الإبداع والابتكار', {
    greeting: greeting(params.name),
    title: 'تم تسجيلك بنجاح',
    paragraphs: [
      `انضممت إلى منصة مؤتمر الإبداع والابتكار بصفة ${role}، وحسابك جاهز الآن.`,
      'من حسابك تجد بطاقة الدخول برمزها، وشهادتك، وما تقدّمه من أعمال.',
    ],
    badge,
    button: { label: 'الدخول إلى حسابي', href: `${siteUrl}/login` },
    note: 'احتفظ ببطاقتك على هاتفك — يُمسح رمزها عند بوابة فعاليات المؤتمر.',
  }, attachments);
}
