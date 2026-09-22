'use client';

import { useState, useTransition } from 'react';
import { FileText, Trash2, Loader2, AlertTriangle, Paperclip } from 'lucide-react';
import { DOCUMENT_ACCEPT, MAX_DOCUMENT_BYTES, MAX_FILES_PER_SUBMISSION } from '@/lib/upload-rules';
import { deleteSubmissionFile } from './actions';

/**
 * The work itself, attached to the submission.
 *
 * The section was built for innovations, which are introduced with a cover
 * image — so a research paper had nowhere to go but the description box. Both
 * paths now attach their own files: a manuscript, a presentation, the photos
 * of a prototype.
 */

export interface AttachedFile {
  id: string;
  url: string;
  name: string;
  sizeBytes: number;
}

const MB = (bytes: number) => Math.round((bytes / (1024 * 1024)) * 10) / 10;

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ك.ب`;
  return `${MB(bytes)} م.ب`;
}

function ExistingFile({ file, editable }: { file: AttachedFile; editable: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <li
      className="flex flex-wrap items-center gap-2.5 rounded-xl px-3 py-2.5"
      style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <FileText className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} aria-hidden />
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 flex-1 truncate text-[12.5px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {file.name}
      </a>
      <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
        {humanSize(file.sizeBytes)}
      </span>

      {editable && (
        <button
          type="button"
          disabled={pending}
          aria-label={`حذف ${file.name}`}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteSubmissionFile(file.id);
              if (result?.error) setError(result.error);
            })
          }
          className="rounded-lg p-1 transition-opacity disabled:opacity-50"
          style={{ color: 'var(--destructive)' }}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      )}

      {error && (
        <span className="w-full text-[11.5px]" style={{ color: 'var(--destructive)' }}>
          {error}
        </span>
      )}
    </li>
  );
}

export default function SubmissionFiles({
  files = [],
  editable = true,
}: {
  files?: AttachedFile[];
  /** False once the committee has it — the files are part of what they judge. */
  editable?: boolean;
}) {
  const [picked, setPicked] = useState<File[]>([]);
  const remaining = Math.max(0, MAX_FILES_PER_SUBMISSION - files.length);

  // Counted in the browser as well as on the server. The server is what
  // enforces it; this is so somebody is told before a slow upload rather than
  // after it.
  const tooMany = picked.length > remaining;
  const tooBig = picked.find((f) => f.size > MAX_DOCUMENT_BYTES);

  return (
    <div>
      <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        ملفات المشروع
      </label>
      <p className="mb-2.5 text-[11.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        أرفق ما يمثّل عملك — بحثاً بصيغة PDF، عرضاً تقديمياً، أو صوراً للنموذج.
        حتى {MAX_FILES_PER_SUBMISSION} ملفات، وحجم كل ملف {MB(MAX_DOCUMENT_BYTES)} م.ب كحدّ أقصى.
      </p>

      {files.length > 0 && (
        <ul className="mb-3 space-y-2">
          {files.map((f) => (
            <ExistingFile key={f.id} file={f} editable={editable} />
          ))}
        </ul>
      )}

      {editable && remaining > 0 && (
        <>
          <input
            type="file"
            name="files"
            multiple
            accept={DOCUMENT_ACCEPT}
            onChange={(e) => setPicked([...(e.target.files ?? [])])}
            className="text-[13px]"
            style={{ color: 'var(--text-secondary)' }}
          />

          {picked.length > 0 && !tooMany && !tooBig && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
              <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
              {picked.length === 1 ? 'ملف واحد جاهز للرفع' : `${picked.length} ملفات جاهزة للرفع`}
            </p>
          )}

          {(tooMany || tooBig) && (
            <p className="mt-2 flex items-start gap-1.5 text-[11.5px]" style={{ color: 'var(--destructive)' }}>
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              {tooMany
                ? `يمكنك إضافة ${remaining} ${remaining === 1 ? 'ملف' : 'ملفات'} فقط`
                : `«${tooBig!.name}» أكبر من ${MB(MAX_DOCUMENT_BYTES)} م.ب`}
            </p>
          )}
        </>
      )}

      {editable && remaining === 0 && (
        <p className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
          بلغت الحد الأقصى للملفات — احذف ملفاً لإضافة غيره.
        </p>
      )}
    </div>
  );
}
