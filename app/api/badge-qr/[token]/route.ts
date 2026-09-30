import { NextResponse } from 'next/server';
import { qrPng } from '@/lib/qr-png';
import { isBadgeTokenShape } from '@/lib/badge-token';

/**
 * The badge QR, as an image, for the welcome email.
 *
 * A mail client cannot run anything, so the symbol on the badge in an email
 * has to arrive as a file over HTTP. This renders one.
 *
 * It reads nothing and looks nothing up: it turns the token in the URL into
 * the picture of that token, and refuses anything that is not shaped like one.
 * So it reveals nothing to somebody who does not already hold the token — and
 * whoever holds it already has the badge. The gate still checks the account's
 * admission in the database before anybody is counted through, which is what
 * actually decides.
 */

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // Refused rather than rendered: without this the route is an open QR
  // generator for any string somebody cares to put in a URL.
  if (!isBadgeTokenShape(token)) {
    return NextResponse.json({ error: 'رمز غير صالح' }, { status: 400 });
  }

  const png = qrPng(token, { correction: 'Q', scale: 8, margin: 3 });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // The symbol for a given token never changes, and a mail client may
      // fetch it years later through an image proxy.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(png.length),
    },
  });
}
