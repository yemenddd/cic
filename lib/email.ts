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

export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain text. Every message here is transactional, none of it is marketing. */
  text: string;
}

export type EmailResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'rejected'; detail?: string };

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
