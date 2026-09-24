import { prisma } from '@/lib/db/client';
import { currentUser } from '@/lib/auth-guards';
import { readDocument } from '@/lib/blob';

/**
 * Hand back a submission's attached file, to somebody entitled to read it.
 *
 * These are stored privately (see lib/blob.ts), so this route is the only way
 * to them. It exists because the alternative — a public blob URL — protects an
 * unpublished research paper with nothing but the secrecy of a link, and links
 * are shared, logged by proxies, and carried in referrer headers.
 *
 * Two people may read one: its owner, and any organizer. The review committee
 * has to be able to open what it is judging, and the author has to be able to
 * check what they sent.
 */
export async function GET(
  _req: Request,
  // Next.js 16: params is a Promise and must be awaited.
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) return new Response('غير مصرح', { status: 401 });

  const file = await prisma.submissionFile.findUnique({
    where: { id },
    select: {
      url: true,
      name: true,
      contentType: true,
      submission: { select: { userId: true } },
    },
  });

  // A file that does not exist and a file belonging to somebody else are the
  // same answer, deliberately: distinguishing them turns this into a way to
  // learn which ids are real.
  const mayRead = Boolean(file) && (user.role === 'ADMIN' || file!.submission.userId === user.id);
  if (!file || !mayRead) return new Response('غير موجود', { status: 404 });

  const blob = await readDocument(file.url);
  if (!blob) return new Response('غير موجود', { status: 404 });

  // The uploader's own filename comes back here, as a header value.
  //
  // HTTP headers are ByteStrings — Latin-1 — so an Arabic filename thrown in
  // raw makes the response throw, which is most filenames this platform will
  // ever see. RFC 6266 answers exactly this: an ASCII `filename` for anything
  // that cannot read the extended form, and a percent-encoded `filename*` that
  // carries the real name. Both are stripped of the characters that would let
  // a name break out of the header.
  const clean = file.name.replace(/["\\\r\n]/g, '').slice(0, 120) || 'file';
  const ascii = clean.replace(/[^\x20-\x7E]/g, '_') || 'file';
  const encoded = encodeURIComponent(clean);

  return new Response(blob.body, {
    headers: {
      'Content-Type': file.contentType || blob.contentType,
      'Content-Disposition': `inline; filename="${ascii}"; filename*=UTF-8''${encoded}`,
      // Never shared, never stored by an intermediary: the response is
      // different for every caller and some callers are not entitled to it.
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
