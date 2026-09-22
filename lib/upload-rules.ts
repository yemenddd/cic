/**
 * What may be attached to a submission, as plain data.
 *
 * Separate from lib/blob.ts because the upload form is a client component and
 * lib/blob.ts imports @vercel/blob — reading a constant from there would pull
 * the storage SDK into the browser bundle and fail the build. The same split
 * lib/password-rules.ts exists for.
 *
 * The server still enforces all of this; what lives here is the part the form
 * needs in order to say no before a slow upload rather than after it.
 */

/**
 * 10 MB per file.
 *
 * Twice the image ceiling, because a paper with figures in it genuinely is
 * twice a photograph — and still small enough that a handful of them per
 * submission cannot run away with the storage budget.
 */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** How many files one submission may carry. */
export const MAX_FILES_PER_SUBMISSION = 5;

/**
 * The formats work actually arrives in.
 *
 * Still an allow-list, and still no SVG and nothing executable: these land on
 * a public URL on a domain this site's CSP does not govern, and any signed-in
 * participant can reach the action that writes them.
 *
 * The value is the extension the stored file is given — never the uploader's,
 * which is attacker-controlled text.
 */
export const ALLOWED_DOCUMENTS: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  // Images too: a photograph of a prototype is the evidence for one path the
  // way a PDF is for the other.
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** The `accept` attribute for a file input, so the picker offers the same list. */
export const DOCUMENT_ACCEPT = Object.keys(ALLOWED_DOCUMENTS).join(',');

const MB = (bytes: number) => Math.round((bytes / (1024 * 1024)) * 10) / 10;

/**
 * Why this file cannot be attached, or null.
 *
 * Names the file in every message: somebody who picked five at once needs to
 * know which of them was the problem.
 */
export function checkDocumentUpload(file: { name: string; size: number; type: string }): string | null {
  if (file.size === 0) return `الملف «${file.name}» فارغ`;
  if (file.size > MAX_DOCUMENT_BYTES) {
    return `«${file.name}» حجمه ${MB(file.size)} م.ب — الحد الأقصى ${MB(MAX_DOCUMENT_BYTES)} م.ب`;
  }
  if (!ALLOWED_DOCUMENTS[file.type]) {
    return `صيغة «${file.name}» غير مدعومة — استخدم PDF أو Word أو PowerPoint أو صورة`;
  }
  return null;
}
