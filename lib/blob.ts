import { put, del } from '@vercel/blob';
import { ALLOWED_DOCUMENTS, checkDocumentUpload } from '@/lib/upload-rules';

/**
 * Uploads.
 *
 * Everything here lands in public blob storage under its own URL, so what is
 * accepted matters more than it looks. One of the callers —
 * app/dashboard/innovations/actions.ts — is reachable by any signed-in
 * participant, not only by an organiser, and it previously accepted a file of
 * any size and any type. That meant an attendee could park arbitrary content
 * (an HTML page, an SVG carrying script) on a public URL, or simply upload
 * until the storage bill noticed.
 *
 * So: a size ceiling, an allow-list of real image types, and a filename the
 * uploader does not control.
 */

/**
 * 5 MB. Comfortably past a photograph taken on a phone and resized by the
 * browser, far below what makes a storage bill interesting.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Raster images only, by design. SVG is deliberately absent: it is a document
 * format that can carry script, and it would be served from a public URL on a
 * domain this site's CSP does not govern.
 */
const ALLOWED = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
]);

/** Refused uploads carry a message meant to be shown to whoever tried. */
export class UploadError extends Error {}

const MB = (bytes: number) => Math.round((bytes / (1024 * 1024)) * 10) / 10;

/**
 * Check a file before it is stored.
 *
 * Exported so it can be tested without a network call, and so a caller can
 * reject early rather than discovering the problem mid-write.
 */
export function checkUpload(file: File): string | null {
  if (file.size === 0) return 'الملف فارغ';
  if (file.size > MAX_UPLOAD_BYTES) {
    return `حجم الملف ${MB(file.size)} م.ب — الحد الأقصى ${MB(MAX_UPLOAD_BYTES)} م.ب`;
  }
  // The browser reports the type, so this is not proof of content — but it
  // does stop the ordinary case, and the extension below is ours regardless,
  // so nothing is served as a document whatever the bytes turn out to be.
  if (!ALLOWED.has(file.type)) {
    return 'الصيغة غير مدعومة — استخدم صورة بصيغة JPG أو PNG أو WEBP';
  }
  return null;
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const problem = checkUpload(file);
  if (problem) throw new UploadError(problem);

  // The stored name is generated, never the uploader's: `file.name` is
  // attacker-controlled text that would otherwise appear verbatim in a public
  // URL, and its extension would decide how the file is served back.
  const extension = ALLOWED.get(file.type) ?? 'bin';
  const blob = await put(`${folder}/${crypto.randomUUID()}.${extension}`, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: file.type,
  });
  return blob.url;
}

// The rules themselves live in lib/upload-rules.ts, which imports nothing —
// the upload form is a client component, and reading them from here would pull
// @vercel/blob into the browser bundle. Re-exported so server callers have one
// import rather than two.
export {
  MAX_DOCUMENT_BYTES, MAX_FILES_PER_SUBMISSION, DOCUMENT_ACCEPT, checkDocumentUpload,
} from '@/lib/upload-rules';

export interface StoredDocument {
  url: string;
  /** The uploader's own filename, for display only — never part of the URL. */
  name: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Store a submission's own work.
 *
 * A cover photograph is meant to be looked at; an unpublished research paper
 * is not. So the blob URL of a document is never handed to a browser — the
 * files are served back through a route that checks the caller first
 * (app/api/submission-files/[id]), and the URL stays a server-side handle.
 *
 * It is still written to a public store, and that is a limitation rather than
 * a choice: `access: 'private'` is refused by the store itself — "Cannot use
 * private access on a public store" — and moving to one is a second Blob store
 * on the account, which is a billing decision and not this code's to make.
 *
 * What that leaves: the URL is unguessable and never published, so the file is
 * reachable only by somebody the route has vetted — unless the URL itself
 * leaks from the database or a server log. Closing that last gap needs the
 * private store; everything up to it is closed here.
 */
export async function uploadDocument(file: File, folder: string): Promise<StoredDocument> {
  const problem = checkDocumentUpload(file);
  if (problem) throw new UploadError(problem);

  // The stored name is generated, exactly as for images: `file.name` is
  // attacker-controlled text that would otherwise appear verbatim in a URL and
  // decide how the file is served back. The original is kept in the database
  // as a label instead.
  const extension = ALLOWED_DOCUMENTS[file.type] ?? 'bin';
  const blob = await put(`${folder}/${crypto.randomUUID()}.${extension}`, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: file.type,
  });

  return {
    url: blob.url,
    name: file.name.slice(0, 200),
    contentType: file.type,
    sizeBytes: file.size,
  };
}

/**
 * Read a stored document back, for a caller the route has already vetted.
 *
 * A plain server-side fetch, because the store is public (see uploadDocument).
 * The point of going through here rather than redirecting the browser is that
 * the blob URL never reaches the client: the only address anybody outside the
 * server sees is /api/submission-files/<id>, which checks who is asking.
 *
 * If the store is ever moved to private access, this is the one function that
 * changes — to `get(url, { access: 'private' })` — and nothing else does.
 *
 * Returns null when the object is gone: a file deleted from the store while a
 * row still points at it is a 404 for whoever asked, not a crash.
 */
export async function readDocument(url: string): Promise<{
  body: ReadableStream;
  contentType: string;
} | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok || !res.body) return null;
    return {
      body: res.body,
      contentType: res.headers.get('content-type') ?? 'application/octet-stream',
    };
  } catch (err) {
    console.error('[blob] could not read a stored document:', err);
    return null;
  }
}

export async function deleteImage(url: string): Promise<void> {
  try {
    await del(url);
  } catch (err) {
    // Non-fatal — the DB record is what matters; an orphaned blob can be
    // cleaned up later and shouldn't block the admin action.
    console.error('Failed to delete blob:', err);
  }
}
