'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleCheck, Send } from 'lucide-react';
import type { SurveyQuestionKind } from '@prisma/client';
import { scaleOf } from '@/lib/survey';

export interface FormQuestion {
  id: string;
  section: string;
  prompt: string;
  help: string | null;
  kind: SurveyQuestionKind;
  options: string[];
  required: boolean;
}

interface Answer {
  rating?: number;
  text?: string;
  choices?: string[];
}

/** The ends of the 1–5 scale, named. A bare row of numbers means nothing. */
const RATING_ENDS = { low: 'ضعيف', high: 'ممتاز' };

export default function SurveyForm({
  questions,
  signedIn,
}: {
  questions: FormQuestion[];
  signedIn: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const firstMissing = useRef<HTMLDivElement | null>(null);
  const [missingId, setMissingId] = useState<string | null>(null);

  // Questions arrive in order; the headings are the order's own grouping, so
  // a section is simply a run of questions that share one.
  const sections = useMemo(() => {
    const out: { name: string; items: FormQuestion[] }[] = [];
    for (const q of questions) {
      const last = out[out.length - 1];
      if (last && last.name === q.section) last.items.push(q);
      else out.push({ name: q.section, items: [q] });
    }
    return out;
  }, [questions]);

  const set = (id: string, patch: Answer) => {
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    if (missingId === id) setMissingId(null);
  };

  const answered = (q: FormQuestion): boolean => {
    const a = answers[q.id];
    if (!a) return false;
    if (scaleOf(q.kind)) return typeof a.rating === 'number';
    if (q.kind === 'TEXT') return Boolean(a.text?.trim());
    return Boolean(a.choices?.length);
  };

  const submit = async () => {
    setError(null);

    // Checked here so somebody is told which question, on the question, rather
    // than by a sentence at the bottom of a long form.
    const missing = questions.find((q) => q.required && !answered(q));
    if (missing) {
      setMissingId(missing.id);
      firstMissing.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setError('هناك سؤال مطلوب بلا إجابة.');
      return;
    }

    setBusy(true);
    try {
      const payload = questions
        .filter(answered)
        .map((q) => ({
          questionId: q.id,
          rating: answers[q.id]?.rating ?? null,
          text: answers[q.id]?.text ?? null,
          choices: answers[q.id]?.choices ?? [],
        }));

      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setError(data?.error || 'تعذّر إرسال إجابتك، حاول مرة أخرى');
        return;
      }
      setSent(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('تعذّر الاتصال — تحقّق من الشبكة وحاول مرة أخرى');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div dir="rtl" className="mx-auto w-full max-w-xl px-4 py-24 sm:px-6">
        <div
          className="rounded-2xl p-7 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <span
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--accent-cyan) 16%, transparent)' }}
          >
            <CircleCheck className="h-6 w-6" style={{ color: 'var(--accent-cyan)' }} strokeWidth={1.6} />
          </span>
          <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            وصلتنا إجابتك
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            شكراً لوقتك. ما كتبته يُقرأ، وهو ما تُبنى عليه الدورة القادمة.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            العودة للموقع
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const requiredCount = questions.filter((q) => q.required).length;

  return (
    // The site header is fixed, 56px tall on a phone and 60 above it, so the
    // page has to start below it rather than at the top of the viewport. At
    // py-12 the heading slid underneath and was cut in half. The same offset
    // the registration form uses, for the same reason.
    <div dir="rtl" className="mx-auto w-full max-w-2xl px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
      <h1 className="font-outfit font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
        استبيان المؤتمر
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        دقيقتان من وقتك. {requiredCount > 0 && `المطلوب منها ${requiredCount} فقط، وما عداه اختياري — `}
        أجب عمّا تعرفه واترك الباقي.
        {!signedIn && ' لا حاجة لتسجيل الدخول.'}
      </p>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.name}>
            <h2
              className="mb-3 font-outfit font-bold text-[15px]"
              style={{ color: 'var(--text-primary)' }}
            >
              {section.name}
            </h2>

            <div className="space-y-3">
              {section.items.map((q) => {
                const missing = missingId === q.id;
                return (
                  <div
                    key={q.id}
                    ref={missing ? firstMissing : undefined}
                    className="rounded-2xl p-5"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: `1px solid ${missing ? 'var(--destructive)' : 'var(--mat-liquid-border)'}`,
                    }}
                  >
                    <p className="text-[14px] font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {q.prompt}
                      {q.required && <span style={{ color: 'var(--destructive)' }}> *</span>}
                    </p>
                    {q.help && (
                      <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                        {q.help}
                      </p>
                    )}

                    <div className="mt-3.5">
                      <QuestionInput q={q} value={answers[q.id]} onChange={(patch) => set(q.id, patch)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {error && (
        <p className="mt-5 text-[13px]" style={{ color: 'var(--destructive)' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-[14px] font-semibold transition-opacity disabled:opacity-60 sm:w-auto"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
      >
        <Send className="h-4 w-4" />
        {busy ? '...جارٍ الإرسال' : 'إرسال إجابتي'}
      </button>

      <p className="mt-4 text-[12px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        تُقرأ الإجابات مجتمعة لتحسين الدورة القادمة.
        {signedIn
          ? ' إجابتك مرتبطة بحسابك، ويمكن إرسالها مرة واحدة.'
          : ' لا نطلب اسمك ولا بريدك في هذا النموذج.'}
      </p>
    </div>
  );
}

/** The one place that knows how each kind is answered. */
function QuestionInput({
  q,
  value,
  onChange,
}: {
  q: FormQuestion;
  value: Answer | undefined;
  onChange: (patch: Answer) => void;
}) {
  const scale = scaleOf(q.kind);

  if (scale) {
    const points: number[] = [];
    for (let i = scale.min; i <= scale.max; i++) points.push(i);

    return (
      <div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={q.prompt}>
          {points.map((p) => {
            const on = value?.rating === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange({ rating: p })}
                // 44px: the smallest target a thumb hits reliably, and this is
                // a form most people will open on a phone.
                className="tabular-nums rounded-xl text-[14px] font-semibold transition-colors"
                style={{
                  minWidth: 44, height: 44,
                  background: on ? 'var(--primary)' : 'var(--mat-liquid-bg)',
                  color: on ? 'var(--primary-foreground)' : 'var(--text-secondary)',
                  border: `1px solid ${on ? 'var(--primary)' : 'var(--mat-liquid-border)'}`,
                  flex: q.kind === 'SCALE_10' ? '1 1 44px' : undefined,
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
        {q.kind === 'RATING' && (
          <div className="mt-1.5 flex justify-between text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            <span>{RATING_ENDS.low}</span>
            <span>{RATING_ENDS.high}</span>
          </div>
        )}
      </div>
    );
  }

  if (q.kind === 'TEXT') {
    return (
      <textarea
        value={value?.text ?? ''}
        onChange={(e) => onChange({ text: e.target.value })}
        rows={3}
        maxLength={2000}
        className="input-glass"
        style={{ height: 'auto', resize: 'vertical', paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
        placeholder="اكتب هنا…"
      />
    );
  }

  const chosen = value?.choices ?? [];
  const multi = q.kind === 'MULTI';

  return (
    <div className="flex flex-wrap gap-2">
      {q.options.map((opt) => {
        const on = chosen.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={on}
            onClick={() =>
              onChange({
                choices: multi
                  ? on ? chosen.filter((c) => c !== opt) : [...chosen, opt]
                  : [opt],
              })
            }
            className="rounded-xl px-4 text-[13px] font-semibold transition-colors"
            style={{
              minHeight: 44,
              background: on ? 'var(--primary)' : 'var(--mat-liquid-bg)',
              color: on ? 'var(--primary-foreground)' : 'var(--text-secondary)',
              border: `1px solid ${on ? 'var(--primary)' : 'var(--mat-liquid-border)'}`,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
