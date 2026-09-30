import { siteUrl } from '@/lib/site';

/**
 * The look of every message this platform sends.
 *
 * Mail is not the web. What renders here has to survive Outlook's Word
 * rendering engine, Gmail stripping most of a <style> block, and a phone in
 * dark mode deciding to invert the colours — so the rules are older than they
 * look: tables for layout, every style inline, no flex, no grid, fixed width
 * with a fluid fallback, and a plain-text twin that always arrives.
 *
 * On the typeface: the platform is set in IBM Plex Sans Arabic and this asks
 * for it first, but a web font in mail is a request, not an instruction —
 * Apple Mail honours it, Gmail's web client ignores @font-face outright. Every
 * client therefore gets a stack that lands on a system Arabic face it already
 * has, which is why the sizes and line heights below are chosen to read well
 * in any of them rather than tuned to one.
 */

const BRAND = {
  ink: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  hair: '#e2e8f0',
  page: '#f1f5f9',
  card: '#ffffff',
  teal: '#12a5b0',
  deep: '#1d4e63',
};

/** Ordered so the first name a client actually has installed wins. */
const FONT = "'IBM Plex Sans Arabic', 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Arial, sans-serif";

/**
 * Direction, repeated on the elements themselves.
 *
 * Gmail throws away <html>, <head> and <body> and drops what is left into its
 * own document, which is left-to-right. A dir on <html> therefore survives in
 * Apple Mail and vanishes in Gmail — where every Arabic paragraph rendered
 * left-to-right and each full stop jumped to the wrong end of its line. So the
 * attribute goes on the tables, the cells and the text blocks, which are the
 * parts Gmail actually keeps.
 */
const RTL = 'dir="rtl"';

/** The id the attached QR is referenced by, from both sides. */
export const QR_CID = 'badge-qr';

/**
 * The mark, white, on the header's dark ground.
 *
 * An absolute URL because a mail client has no page to resolve a relative one
 * against, and every client that blocks images by default shows the alt text
 * instead — which is why it reads as the conference's name rather than "logo".
 *
 * A separate file from the one the badge uses, at 380px rather than 2085px.
 * Not for the bytes: a mail client is free to lay an image out at its natural
 * size, and a 2085px picture in a 600px message is then a message two thousand
 * pixels wide with a scrollbar under it. Shipping the mark at twice the size it
 * is drawn at means the worst a client can do is draw it slightly large.
 */
const LOGO_SRC = `${siteUrl}/images/logos/email_logo.png`;
const LOGO_W = 190;
const LOGO_H = 61;

export interface EmailButton {
  label: string;
  href: string;
}

/** A label and its value, laid out as a row rather than run together. */
export interface CalloutRow {
  k: string;
  v: string;
}

export interface EmailContent {
  /** Shown large at the top of the card. */
  title: string;
  /** "مرحباً فلان،" — omitted when there is nobody to greet. */
  greeting?: string;
  /** One paragraph each. */
  paragraphs: string[];
  button?: EmailButton;
  /** Set apart in a bordered block — a reason for refusal, a set of details. */
  callout?: { label: string; body?: string; rows?: CalloutRow[] };
  /** The entrance pass, with its QR. */
  badge?: EmailBadge;
  /** Small print under the rule at the bottom of the card. */
  note?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The entrance pass, drawn in the message itself.
 *
 * The QR arrives as a file over HTTP because a mail client runs nothing — see
 * app/api/badge-qr. Every part of it is repeated in text underneath: most
 * clients hide images until the reader asks for them, and a badge nobody can
 * read is worse than no badge. The code below the symbol is what the door
 * accepts when a phone screen will not scan.
 */
export interface EmailBadge {
  name: string;
  categoryLabel: string;
  code: string;
  /** The signed token the scanner reads. Omitted, the card shows the code alone. */
  token?: string;
}

function badgeHtml(b: EmailBadge): string {
  // cid: — the symbol is attached to the message, not fetched from a server.
  // Hosting it meant the image was a request Gmail made to a URL, which is one
  // more thing to be blocked, to be offline, or to not exist yet; attached, it
  // arrives with the mail and is there forever.
  const qr = b.token
    ? `<img src="cid:${QR_CID}" width="168" height="168"
          alt="رمز الدخول — ${esc(b.code)}"
          style="display:block;width:168px;height:168px;border:0;outline:none;margin:0 auto 10px;background:#ffffff;">`
    : '';

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px;" dir="rtl">
      <tr><td align="center" style="background:#ffffff;border:1px solid ${BRAND.hair};border-radius:14px;padding:20px 18px;">
        <div ${RTL} style="font-size:12px;font-weight:700;letter-spacing:.06em;color:${BRAND.muted};font-family:${FONT};margin-bottom:12px;text-align:center;">بطاقة الدخول</div>
        ${qr}
        <div ${RTL} style="font-size:16px;font-weight:700;color:${BRAND.ink};font-family:${FONT};text-align:center;">${esc(b.name)}</div>
        <div ${RTL} style="font-size:13.5px;color:${BRAND.muted};font-family:${FONT};margin-top:3px;text-align:center;">${esc(b.categoryLabel)}</div>
        <div ${RTL} style="margin-top:12px;font-size:17px;font-weight:700;letter-spacing:.08em;color:${BRAND.deep};font-family:${FONT};text-align:center;unicode-bidi:isolate;">${esc(b.code)}</div>
        <div ${RTL} style="font-size:11.5px;color:${BRAND.muted};font-family:${FONT};margin-top:6px;text-align:center;">امسح هذا الرمز عند الدخول</div>
      </td></tr>
    </table>`;
}

/**
 * The same content as plain text.
 *
 * Not a fallback nobody sees: it is what a text-only client shows, what a
 * screen reader may prefer, and what spam filters read to check the HTML is
 * not hiding something. Sending HTML without it is how a message lands in a
 * junk folder.
 */
export function renderText(c: EmailContent): string {
  const lines: string[] = [];
  if (c.greeting) lines.push(c.greeting, '');
  lines.push(c.title, '');
  for (const p of c.paragraphs) lines.push(p, '');
  if (c.callout) {
    lines.push(`${c.callout.label}:`);
    if (c.callout.body) lines.push(c.callout.body);
    for (const r of c.callout.rows ?? []) lines.push(`${r.k}: ${r.v}`);
    lines.push('');
  }
  if (c.badge) {
    lines.push('بطاقة الدخول:');
    lines.push(`${c.badge.name} — ${c.badge.categoryLabel}`);
    lines.push(`رمز التأكيد: ${c.badge.code}`);
    lines.push('');
  }
  if (c.button) lines.push(c.button.label + ':', c.button.href, '');
  if (c.note) lines.push(c.note, '');
  lines.push('فريق تنظيم مؤتمر الإبداع والابتكار');
  lines.push(`${siteUrl}`);
  return lines.join('\n');
}

function calloutHtml(c: NonNullable<EmailContent['callout']>): string {
  // One centred line per row. The value keeps its own direction so a Latin
  // address inside a right-to-left line is not reordered around its label.
  const rows = (c.rows ?? [])
    .map(
      (r) => `<div ${RTL} style="margin:5px 0;font-size:14px;line-height:1.8;font-family:${FONT};text-align:center;">
        <span style="color:${BRAND.muted};">${esc(r.k)}:</span>
        <span style="color:${BRAND.ink};font-weight:500;unicode-bidi:isolate;">${esc(r.v)}</span>
      </div>`,
    )
    .join('');

  const body = c.body
    ? `<div ${RTL} style="font-size:14.5px;line-height:1.8;color:${BRAND.ink};font-family:${FONT};white-space:pre-line;text-align:center;">${esc(c.body)}</div>`
    : '';

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;" dir="rtl">
      <tr><td style="background:${BRAND.page};border-radius:10px;padding:16px;" align="center">
        <div ${RTL} style="font-size:12px;font-weight:700;letter-spacing:.04em;color:${BRAND.muted};font-family:${FONT};margin-bottom:8px;text-align:center;">${esc(c.label)}</div>
        ${body}
        ${rows}
      </td></tr>
    </table>`;
}

export function renderHtml(c: EmailContent): string {
  const paragraphs = c.paragraphs
    .map(
      (p) =>
        `<p ${RTL} style="margin:0 0 16px;font-size:15px;line-height:1.85;color:${BRAND.body};font-family:${FONT};text-align:center;">${esc(p)}</p>`,
    )
    .join('');

  const callout = c.callout ? calloutHtml(c.callout) : '';
  const badge = c.badge ? badgeHtml(c.badge) : '';

  // A table cell carrying the fill, with the anchor padded inside it — the
  // shape that survives clients which refuse background colour on an <a>.
  const button = c.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px auto 24px;">
         <tr><td align="center" bgcolor="${BRAND.deep}" style="border-radius:10px;">
           <a href="${esc(c.button.href)}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:${FONT};border-radius:10px;">${esc(c.button.label)}</a>
         </td></tr>
       </table>`
    : '';

  const note = c.note
    ? `<p ${RTL} style="margin:0;font-size:12.5px;line-height:1.7;color:${BRAND.muted};font-family:${FONT};text-align:center;">${esc(c.note)}</p>`
    : '';

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(c.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  /* No element may be wider than what holds it, and no word may push past the
     edge — a long token or URL is what usually forces a message sideways. */
  body,table,td,div,p,a{max-width:100%;}
  table{border-collapse:collapse;}
  img{max-width:100%;height:auto;}
  p,div,td{overflow-wrap:break-word;word-wrap:break-word;}
  @media (max-width:620px){
    .wrap{width:100%!important}
    .pad{padding:24px 18px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.page};">
<!-- Shown in the inbox list beside the subject, then hidden. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(c.paragraphs[0] ?? c.title)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.page};width:100%;max-width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:28px 12px;">

  <table role="presentation" ${RTL} class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;">

    <!-- Header: the mark itself, on the brand's deep ground. -->
    <tr><td style="background:${BRAND.deep};border-radius:14px 14px 0 0;padding:24px 28px;" align="center">
      <!-- Both dimensions stated, in pixels, in the attributes and in the
           style. A percentage here (max-width:62% is what used to be in its
           place) resolves against a containing block that a table works out
           from its contents, so the client is free to size the cell from the
           picture instead of the picture from the cell — which is how a 600px
           message ends up as wide as the image inside it. -->
      <img src="${LOGO_SRC}" width="${LOGO_W}" height="${LOGO_H}" alt="مؤتمر الإبداع والابتكار"
           style="display:block;width:${LOGO_W}px;height:${LOGO_H}px;border:0;outline:none;text-decoration:none;margin:0 auto;">
    </td></tr>

    <!-- Card -->
    <tr><td class="pad" ${RTL} style="background:${BRAND.card};padding:30px 28px;" align="center">
      ${c.greeting ? `<p ${RTL} style="margin:0 0 6px;font-size:15px;color:${BRAND.muted};font-family:${FONT};text-align:center;">${esc(c.greeting)}</p>` : ''}
      <h1 ${RTL} style="margin:0 0 18px;font-size:21px;line-height:1.5;font-weight:700;color:${BRAND.ink};font-family:${FONT};text-align:center;">${esc(c.title)}</h1>
      ${paragraphs}
      ${callout}
      ${badge}
      ${button}
      ${note ? `<hr style="border:none;border-top:1px solid ${BRAND.hair};margin:22px 0 16px;">${note}` : ''}
    </td></tr>

    <!-- Footer, centred. -->
    <tr><td style="background:${BRAND.card};border-radius:0 0 14px 14px;border-top:1px solid ${BRAND.hair};padding:20px 28px;" align="center">
      <div ${RTL} style="font-size:13px;font-weight:700;color:${BRAND.ink};font-family:${FONT};text-align:center;">فريق تنظيم مؤتمر الإبداع والابتكار</div>
      <div style="font-size:12.5px;font-family:${FONT};margin-top:6px;text-align:center;">
        <a href="${siteUrl}" style="color:${BRAND.teal};text-decoration:none;">${siteUrl.replace(/^https?:\/\//, '')}</a>
      </div>
    </td></tr>

    <tr><td style="padding:14px 8px 0;" align="center">
      <div ${RTL} style="font-size:11.5px;line-height:1.7;color:${BRAND.muted};font-family:${FONT};text-align:center;">
        رسالة آلية من منصة الإبداع والابتكار — لا حاجة للرد عليها إن لم يُطلب ذلك.
      </div>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`;
}
