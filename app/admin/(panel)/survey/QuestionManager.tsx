'use client';

import { useActionState, useState, useTransition } from 'react';
import {
  ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Plus, Trash2, X,
} from 'lucide-react';
import type { SurveyQuestionKind } from '@prisma/client';
import { TextField, TextAreaField, SelectField } from '@/components/admin/fields';
import { KIND_LABELS } from '@/lib/survey';

type ActionResult = { error?: string; success?: string } | void;

export interface ManagedQuestion {
  id: string;
  section: string;
  promptAr: string;
  helpAr: string | null;
  kind: SurveyQuestionKind;
  options: string[];
  required: boolean;
  active: boolean;
  answerCount: number;
}

const KIND_OPTIONS = (Object.keys(KIND_LABELS) as SurveyQuestionKind[])
  .map((k) => ({ value: k, label: KIND_LABELS[k] }));

/**
 * The question list, and everything that can be done to it.
 *
 * Editing is inline rather than on its own page: the thing an organizer is
 * deciding is how one question reads next to the others, and a form on a
 * separate screen takes that away.
 */
export default function QuestionManager({
  questions,
  sections,
  addAction,
  updateAction,
  deleteAction,
  onToggleActive,
  onToggleRequired,
  onMove,
}: {
  questions: ManagedQuestion[];
  /** The sections already in use, offered as a datalist rather than a closed set. */
  sections: string[];
  addAction: (state: ActionResult, form: FormData) => Promise<ActionResult>;
  updateAction: (state: ActionResult, form: FormData) => Promise<ActionResult>;
  deleteAction: (state: ActionResult, form: FormData) => Promise<ActionResult>;
  onToggleActive: (id: string, active: boolean) => Promise<ActionResult>;
  onToggleRequired: (id: string, required: boolean) => Promise<ActionResult>;
  onMove: (id: string, direction: 'up' | 'down') => Promise<ActionResult>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<ActionResult>(undefined);

  const run = (fn: () => Promise<ActionResult>) => start(async () => setNote(await fn()));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {questions.filter((q) => q.active).length} سؤالاً في النموذج
          {questions.some((q) => !q.active) && ` · ${questions.filter((q) => !q.active).length} موقوف`}
        </p>

        <button
          type="button"
          onClick={() => { setAdding((v) => !v); setEditing(null); }}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
          style={{ background: adding ? 'var(--mat-liquid-bg)' : 'var(--primary)', color: adding ? 'var(--text-primary)' : 'var(--primary-foreground)', border: adding ? '1px solid var(--mat-liquid-border)' : undefined }}
        >
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {adding ? 'إلغاء' : 'سؤال جديد'}
        </button>
      </div>

      {note?.error && <p className="mb-3 text-[13px]" style={{ color: 'var(--destructive)' }}>{note.error}</p>}
      {note?.success && <p className="mb-3 text-[13px]" style={{ color: '#22c55e' }}>{note.success}</p>}

      {adding && (
        <QuestionForm
          action={addAction}
          submitLabel="إضافة السؤال"
          onDone={() => setAdding(false)}
        />
      )}

      <datalist id="survey-sections">
        {sections.map((s) => <option key={s} value={s} />)}
      </datalist>

      <div className="mt-4 space-y-2.5">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="rounded-2xl p-4"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--mat-liquid-border)',
              opacity: q.active ? 1 : 0.6,
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>{q.section}</p>
                <p className="mt-0.5 text-[13.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {q.promptAr}
                  {q.required && <span style={{ color: 'var(--destructive)' }}> *</span>}
                </p>
                <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                  {KIND_LABELS[q.kind]}
                  {q.options.length > 0 && ` · ${q.options.length} خيارات`}
                  {` · ${q.answerCount} إجابة`}
                  {!q.active && ' · موقوف'}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <IconButton title="أعلى" disabled={i === 0 || pending} onClick={() => run(() => onMove(q.id, 'up'))}>
                  <ChevronUp className="h-4 w-4" />
                </IconButton>
                <IconButton title="أسفل" disabled={i === questions.length - 1 || pending} onClick={() => run(() => onMove(q.id, 'down'))}>
                  <ChevronDown className="h-4 w-4" />
                </IconButton>
                <IconButton
                  title={q.required ? 'اجعله اختيارياً' : 'اجعله إلزامياً'}
                  disabled={pending}
                  onClick={() => run(() => onToggleRequired(q.id, !q.required))}
                >
                  <span className="text-[13px] font-bold" style={{ color: q.required ? 'var(--destructive)' : 'var(--text-tertiary)' }}>*</span>
                </IconButton>
                <IconButton
                  title={q.active ? 'إيقاف السؤال' : 'إعادته إلى النموذج'}
                  disabled={pending}
                  onClick={() => run(() => onToggleActive(q.id, !q.active))}
                >
                  {q.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </IconButton>
                <IconButton title="تعديل" disabled={pending} onClick={() => { setEditing(editing === q.id ? null : q.id); setAdding(false); }}>
                  <Pencil className="h-4 w-4" />
                </IconButton>
              </div>
            </div>

            {editing === q.id && (
              <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--mat-liquid-border)' }}>
                <QuestionForm
                  question={q}
                  action={updateAction}
                  submitLabel="حفظ التعديل"
                  onDone={() => setEditing(null)}
                />

                <DeleteQuestion question={q} action={deleteAction} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function IconButton({
  children, title, onClick, disabled,
}: { children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      // 36px rather than the icon's own size: these sit in a row and are
      // pressed on a laptop trackpad, and an 16px target between two others is
      // a misclick waiting to happen.
      className="inline-flex items-center justify-center rounded-lg transition-opacity disabled:opacity-30"
      style={{ width: 36, height: 36, color: 'var(--text-secondary)', background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
    >
      {children}
    </button>
  );
}

function QuestionForm({
  question, action, submitLabel, onDone,
}: {
  question?: ManagedQuestion;
  action: (state: ActionResult, form: FormData) => Promise<ActionResult>;
  submitLabel: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [kind, setKind] = useState<SurveyQuestionKind>(question?.kind ?? 'RATING');

  const needsOptions = kind === 'CHOICE' || kind === 'MULTI';

  return (
    <form
      action={formAction}
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
    >
      {question && <input type="hidden" name="id" value={question.id} />}

      <TextField name="section" label="القسم" defaultValue={question?.section} required list="survey-sections" />
      <TextAreaField name="promptAr" label="نص السؤال" defaultValue={question?.promptAr} required />
      <TextField name="helpAr" label="سطر توضيحي (اختياري)" defaultValue={question?.helpAr ?? ''} />

      <SelectField
        name="kind"
        label="نوع الإجابة"
        defaultValue={kind}
        onChange={(v) => setKind(v as SurveyQuestionKind)}
        options={KIND_OPTIONS}
      />

      {question && question.answerCount > 0 && (
        <p className="-mt-2 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          هذا السؤال عليه {question.answerCount} إجابة، فلا يمكن تغيير نوعه.
        </p>
      )}

      {needsOptions && (
        <>
          <TextAreaField name="options" label="الخيارات — خيار في كل سطر" defaultValue={question?.options.join('\n') ?? ''} />
          <p className="-mt-2 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            سطر لكل خيار. خياران على الأقل.
          </p>
        </>
      )}

      <label className="flex items-start gap-2.5 cursor-pointer py-1.5">
        <input type="checkbox" name="required" defaultChecked={question?.required} className="mt-0.5" />
        <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          إلزامي — لا يُرسَل النموذج بدونه
        </span>
      </label>

      {state?.error && <p className="text-[13px]" style={{ color: 'var(--destructive)' }}>{state.error}</p>}
      {state?.success && <p className="text-[13px]" style={{ color: '#22c55e' }}>{state.success}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl px-5 py-2.5 text-[13.5px] font-semibold transition-opacity disabled:opacity-60"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {pending ? '...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl px-5 py-2.5 text-[13.5px] font-semibold"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
        >
          {state?.success ? 'إغلاق' : 'إلغاء'}
        </button>
      </div>
    </form>
  );
}

/**
 * Deleting, kept apart from editing and behind its own confirmation.
 *
 * It takes the answers with it, which is almost never what "remove this
 * question" means once anybody has answered — so the count is on the button
 * and the checkbox is the only way past it.
 */
function DeleteQuestion({
  question, action,
}: {
  question: ManagedQuestion;
  action: (state: ActionResult, form: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="mt-4 border-t pt-4" style={{ borderColor: 'var(--mat-liquid-border)' }}>
      <input type="hidden" name="id" value={question.id} />

      {question.answerCount > 0 && (
        <label className="flex items-start gap-2.5 cursor-pointer py-1.5">
          <input type="checkbox" name="confirm" className="mt-0.5" />
          <span className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            أفهم أن حذف هذا السؤال يحذف معه {question.answerCount} إجابة نهائياً.
            لإخفائه من النموذج مع الاحتفاظ بالإجابات، استخدم «إيقاف السؤال».
          </span>
        </label>
      )}

      {state?.error && <p className="mb-2 text-[13px]" style={{ color: 'var(--destructive)' }}>{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-opacity disabled:opacity-60"
        style={{ background: 'color-mix(in srgb, var(--destructive) 12%, transparent)', color: 'var(--destructive)', border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)' }}
      >
        <Trash2 className="h-3.5 w-3.5" />
        حذف السؤال نهائياً
      </button>
    </form>
  );
}
