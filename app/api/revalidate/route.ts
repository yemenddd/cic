import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

// Configure this URL as a webhook in sanity.io/manage -> API -> Webhooks,
// triggered on create/update/delete, with the secret below as the payload.
export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<{ _type?: string }>(
      req,
      process.env.SANITY_REVALIDATE_SECRET,
    );

    if (!isValidSignature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    if (!body?._type) {
      return NextResponse.json({ message: 'Missing _type in payload' }, { status: 400 });
    }

    // { expire: 0 } forces immediate expiration — appropriate here since an
    // external webhook (not a page visit) is what triggers this revalidation.
    revalidateTag(body._type, { expire: 0 });

    return NextResponse.json({ revalidated: true, type: body._type, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
