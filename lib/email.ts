/**
 * Sending mail.
 *
 * The platform had no way to reach anybody outside the site: announcements
 * land in an in-app feed, so an attendee who does not sign in never learns
 * anything, and somebody who has forgotten their password cannot be sent a
 * way back in.
 *
 * Deliberately one function over `fetch` rather than a provider SDK. The only
 * thing being sent is transactional text, the API is a single POST, and an SDK
 * would add a dependency and a bundle for it.
 *
 * It is also deliberately inert until configured. Without RESEND_API_KEY every
 * call reports `not-configured` and logs — it does not throw, and it does not
 * pretend to have sent anything. That distinction matters: the password-reset
 * flow must behave identically whether or not mail is switched on, or its
 * response becomes a way to discover whether an address is registered.
 */

/**
 * Addresses this platform must never try to deliver to.
 *
 * `.invalid` is reserved by RFC 2606 so it can never resolve, and the door
 * gives every walk-in an address on it — they never handed one over. Sending
 * there produces a hard bounce, and enough hard bounces is how a sending
 * domain stops being trusted by the inbox providers that matter. So the check
 * is here, once, rather than at each call site where it can be forgotten.
 *
 * `.test`, `.example` and `.localhost` are reserved by the same RFC and are
 * refused for the same reason.
 */
const UNDELIVERABLE_TLDS = ['.invalid', '.test', '.example', '.localhost'];

export function isDeliverable(address: string | null | undefined): boolean {
  const value = address?.trim().toLowerCase() ?? '';
  // Not a validator — the provider does that. This only catches the addresses
  // the platform itself invented, plus anything obviously not an address.
  if (!value || !value.includes('@') || value.startsWith('@') || value.endsWith('@')) return false;
  return !UNDELIVERABLE_TLDS.some((tld) => value.endsWith(tld));
}

export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain text. Every message here is transactional, none of it is marketing. */
  text: string;
}

export type EmailResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'undeliverable' | 'rejected'; detail?: string };

const ENDPOINT = 'https://api.resend.com/emails';

/** Whether mail is switched on at all. */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && emailFrom());
}

function emailFrom(): string {
  // Must be an address on a domain verified with the provider, or every send
  // is rejected.
  return process.env.EMAIL_FROM ?? '';
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  // Checked before the configuration test, so this reads the same whether or
  // not mail is switched on: an address the platform invented is never sent
  // to, and that fact does not depend on a key being present.
  if (!isDeliverable(message.to)) {
    return { ok: false, reason: 'undeliverable' };
  }

  if (!emailConfigured()) {
    // Logged rather than swallowed: during setup this is the only sign that a
    // message was meant to go out, and to where.
    console.warn(`[email] not configured — would have sent "${message.subject}" to ${message.to}`);
    return { ok: false, reason: 'not-configured' };
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
      // A hung provider must not hold a server action open until the platform's
      // own request timeout; the caller's flow does not depend on the result.
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error(`[email] provider refused (${response.status}): ${detail.slice(0, 500)}`);
      return { ok: false, reason: 'rejected', detail: String(response.status) };
    }

    return { ok: true };
  } catch (err) {
    console.error('[email] send failed:', err);
    return { ok: false, reason: 'rejected' };
  }
}
