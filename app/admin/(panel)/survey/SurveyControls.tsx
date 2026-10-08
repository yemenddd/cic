'use client';

import { useState, useTransition } from 'react';
import { Link2, Lock, LockOpen } from 'lucide-react';

type ActionResult = { error?: string; success?: string } | void;

/**
 * The switch that decides whether anybody can answer, and the link to hand out.
 *
 * Both here rather than on the settings page: an organizer opening the survey
 * is about to send the link, and the two belong in the same glance. The note
 * shown to somebody arriving while it is closed is edited here too, because it
 * is the other half of closing it.
 */
export default function SurveyControls({
  open,
  note,
  url,
  activeQuestions,
  onSave,
}: {
  open: boolean;
  note: string;
  url: string;
  activeQuestions: number;
  onSave: (open: boolean, note: string) => Promise<ActionResult>;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult>(undefined);
  const [draft, setDraft] = useState(note);
  const [copied, setCopied] = useState(false);

  const save = (nextOpen: boolean) =>
    start(async () => setResult(await onSave(nextOpen, draft)));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // A clipboard the browser refuses is not an error worth a message — the
      // address is on screen and can be selected.
    }
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: open
                ? 'color-mix(in srgb, var(--accent-cyan) 16%, transparent)'
                : 'var(--mat-liquid-bg)',
            }}
          >
            {open
              ? <LockOpen className="h-4 w-4" style={{ color: 'var(--accent-cyan)' }} />
              : <Lock className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />}
          </span>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {open ? 'الاستبيان مفتوح' : 'الاستبيان مغلق'}
            </p>
            <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              {open ? 'أي شخص لديه الرابط يستطيع الإجابة' : 'الرابط يعرض رسالة الإغلاق'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => save(!open)}
          disabled={pending || (!open && activeQuestions === 0)}
          className="rounded-xl px-5 py-2.5 text-[13.5px] font-semibold transition-opacity disabled:opacity-60"
          style={
            open
              ? { background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }
              : { background: 'var(--primary)', color: 'var(--primary-foreground)' }
          }
        >
          {pending ? '...' : open ? 'إغلاق الاستبيان' : 'فتح الاستبيان'}
        </button>
      </div>

      {!open && activeQuestions === 0 && (
        <p className="mt-3 text-[12.5px]" style={{ color: '#f59e0b' }}>
          لا توجد أسئلة مفعّلة — أضف سؤالاً قبل فتح الاستبيان.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code
          dir="ltr"
          className="flex-1 truncate rounded-xl px-3 py-2 text-[12.5px]"
          style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-secondary)', minWidth: 200 }}
        >
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold whitespace-nowrap"
          style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
        >
          <Link2 className="h-3.5 w-3.5" />
          {copied ? 'نُسخ' : 'نسخ الرابط'}
        </button>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          ما يراه من يفتح الرابط وهو مغلق
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          className="input-glass"
          style={{ height: 'auto', resize: 'vertical', paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
        />
        <button
          type="button"
          onClick={() => save(open)}
          disabled={pending || draft === note}
          className="mt-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-opacity disabled:opacity-40"
          style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
        >
          حفظ الرسالة
        </button>
      </div>

      {result?.error && <p className="mt-3 text-[13px]" style={{ color: 'var(--destructive)' }}>{result.error}</p>}
      {result?.success && <p className="mt-3 text-[13px]" style={{ color: '#22c55e' }}>{result.success}</p>}
    </div>
  );
}
