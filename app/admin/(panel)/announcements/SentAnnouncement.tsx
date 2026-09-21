'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Pencil, Trash2, Send, X, Check, Eye } from 'lucide-react';
import { useConfirm } from '@/components/platform/ConfirmDialog';

type ActionResult = { error?: string; success?: string } | void;
type Action = (state: ActionResult, formData: FormData) => Promise<ActionResult>;

export interface SentAnnouncement {
  id: string;
  title: string;
  body: string;
  link: string | null;
  audience: string;
  audienceLabel: string;
  recipients: number;
  /** How many of the delivered copies have been opened. */
  readCount: number;
  sentAt: string;
  sentBy: string | null;
}

function Pending({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? busy : label}</>;
}

/**
 * One announcement that has already gone out, with the three things an
 * organizer can now do to it.
 *
 * All three were missing. The panel could send and then only watch: a wrong
 * room number stayed wrong in several thousand feeds, an announcement sent to
 * the wrong category stayed sent, and somebody who registered on Tuesday never
 * saw Monday's notice. The mechanics for each live in send.ts; this is the
 * surface.
 */
export default function SentAnnouncementCard({
  announcement,
  updateAction,
  removeAction,
  resendAction,
}: {
  announcement: SentAnnouncement;
  updateAction: Action;
  removeAction: Action;
  resendAction: Action;
}) {
  const [editing, setEditing] = useState(false);
  const confirm = useConfirm();

  const [updateState, update] = useActionState(updateAction, undefined);
  const [removeState, remove] = useActionState(removeAction, undefined);
  const [resendState, resend] = useActionState(resendAction, undefined);

  const state = updateState ?? removeState ?? resendState;

  // Reading is the only signal an organizer has that a notice landed at all.
  const readShare =
    announcement.recipients > 0
      ? Math.round((announcement.readCount / announcement.recipients) * 100)
      : 0;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      {editing ? (
        <form action={update} className="space-y-4">
          <input type="hidden" name="id" value={announcement.id} />
          <input type="hidden" name="audience" value={announcement.audience} />

          <div>
            <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              العنوان
            </label>
            <input name="title" defaultValue={announcement.title} required className="input-glass" />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              النص
            </label>
            <textarea
              name="body"
              defaultValue={announcement.body}
              required
              rows={4}
              className="input-glass"
              style={{ height: 'auto', resize: 'vertical', paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              رابط داخلي (اختياري)
            </label>
            <input name="link" defaultValue={announcement.link ?? ''} dir="ltr" className="input-glass" />
          </div>

          <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            التعديل يصل إلى النسخ الموجودة في إشعارات المستلمين. لا يُعاد تنبيههم —
            المقروء يبقى مقروءاً.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Check className="h-3.5 w-3.5" />
              <Pending label="حفظ التعديل" busy="...جارٍ الحفظ" />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold"
              style={{
                background: 'var(--mat-liquid-bg)',
                border: '1px solid var(--mat-liquid-border)',
                color: 'var(--text-secondary)',
              }}
            >
              <X className="h-3.5 w-3.5" />
              إلغاء
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
              {announcement.title}
            </h3>
            <span
              className="shrink-0 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold"
              style={{ background: 'var(--mat-liquid-bg)', color: 'var(--text-secondary)' }}
            >
              {announcement.recipients} مستلم
            </span>
          </div>

          <p
            className="mt-2 whitespace-pre-line text-[13px] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {announcement.body}
          </p>

          {/* How many opened it. The recipient count says how many were
              written to; on its own it says nothing about whether the notice
              was actually seen, which is the thing worth knowing before
              deciding to send it again. */}
          {announcement.recipients > 0 && (
            <div className="mt-3.5">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span
                  className="inline-flex items-center gap-1.5 text-[11.5px]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  فُتح من {announcement.readCount} من {announcement.recipients}
                </span>
                <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {readShare}%
                </span>
              </div>
              <span
                className="block h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: 'var(--mat-liquid-bg)' }}
                role="img"
                aria-label={`فُتح من ${announcement.readCount} من ${announcement.recipients} مستلماً`}
              >
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${readShare}%`, background: 'var(--accent-cyan)' }}
                />
              </span>
            </div>
          )}

          <p className="mt-3 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
            {announcement.audienceLabel} · {announcement.sentAt}
            {announcement.sentBy && ` · ${announcement.sentBy}`}
          </p>

          <div
            className="mt-4 flex flex-wrap items-center gap-2 pt-3"
            style={{ borderTop: '1px solid var(--mat-liquid-border)' }}
          >
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold"
              style={{
                background: 'var(--mat-liquid-bg)',
                border: '1px solid var(--mat-liquid-border)',
                color: 'var(--text-secondary)',
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              تعديل
            </button>

            <form action={resend}>
              <input type="hidden" name="id" value={announcement.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold"
                style={{
                  background: 'var(--mat-liquid-bg)',
                  border: '1px solid var(--mat-liquid-border)',
                  color: 'var(--text-secondary)',
                }}
                title="يُرسل فقط لمن لم يصله بعد"
              >
                <Send className="h-3.5 w-3.5" />
                <Pending label="إرسال للجدد" busy="...جارٍ الإرسال" />
              </button>
            </form>

            <form
              action={remove}
              className="ms-auto"
              onSubmit={async (e) => {
                // Withdrawing removes it from every feed it reached, which is
                // not obvious from the word "delete" — so the confirmation
                // says what will happen rather than asking "are you sure".
                e.preventDefault();
                const form = e.currentTarget;
                const ok = await confirm({
                  title: 'سحب الإعلان؟',
                  body: `سيُحذف من إشعارات ${announcement.recipients} مستلماً أيضاً، ولن يعودوا يرونه.`,
                  confirmLabel: 'اسحب الإعلان',
                  tone: 'danger',
                });
                if (ok) form.requestSubmit();
              }}
            >
              <input type="hidden" name="id" value={announcement.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold"
                style={{
                  background: 'color-mix(in srgb, var(--destructive) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)',
                  color: 'var(--destructive)',
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <Pending label="سحب" busy="...جارٍ السحب" />
              </button>
            </form>
          </div>
        </>
      )}

      {state?.error && (
        <p className="mt-3 text-[12.5px]" style={{ color: 'var(--destructive)' }}>{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-3 text-[12.5px]" style={{ color: 'var(--accent-cyan)' }}>{state.success}</p>
      )}
    </div>
  );
}
