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

export async function uploadDocument(file: File, folder: string): Promise<StoredDocument> {
  const problem = checkDocumentUpload(file);
  if (problem) throw new UploadError(problem);

  // The stored name is generated, exactly as for images: `file.name` is
  // attacker-controlled text that would otherwise appear verbatim in a public
  // URL and decide how the file is served back. The original is kept in the
  // database as a label instead.
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

export async function deleteImage(url: string): Promise<void> {
  try {
    await del(url);
  } catch (err) {
    // Non-fatal — the DB record is what matters; an orphaned blob can be
    // cleaned up later and shouldn't block the admin action.
    console.error('Failed to delete blob:', err);
  }
}
