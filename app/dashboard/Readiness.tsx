import Link from 'next/link';
import { Check, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * How ready this attendee is for the conference.
 *
 * Replaces the old "الخطوات التالية" list, which showed the same three cards
 * to everyone forever — including to someone who had already done all three.
 * The steps here know whether they are done, so the page stops asking for
 * things that are finished and a brand-new account gets a visible first goal
 * instead of a row of zeros.
 */

export interface ReadinessStep {
  key: string;
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  done: boolean;
}

export default function Readiness({ steps }: { steps: ReadinessStep[] }) {
  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  // Guarded: a category with no applicable steps would divide by zero.
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = done === total && total > 0;

  return (
    <section
      className="rounded-2xl p-5 md:p-6"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
          {complete ? 'أنت جاهز للمؤتمر' : 'استعدادك للمؤتمر'}
        </h2>
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {done} من {total}
        </span>
      </div>

      <span
        className="mt-3 mb-5 block h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--mat-liquid-bg)' }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="نسبة اكتمال الاستعداد"
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${percent}%`, background: 'var(--gradient-brand)' }}
        />
      </span>

      <ul className="grid gap-2 sm:grid-cols-2">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <li key={step.key}>
              <Link
                href={step.href}
                className="platform-activity-row flex items-center gap-3 rounded-xl p-3"
                style={{ border: '1px solid var(--mat-liquid-border)' }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    // Solid when done: a tinted wash of the same hue was legible
                    // on the dark canvas but washed out to near-nothing on white.
                    background: step.done ? 'var(--accent-cyan)' : 'var(--mat-liquid-bg)',
                    color: step.done ? '#fff' : 'var(--text-tertiary)',
                  }}
                >
                  {step.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className="block text-[13px] font-semibold"
                    style={{ color: step.done ? 'var(--text-secondary)' : 'var(--text-primary)' }}
                  >
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                    {step.desc}
                  </span>
                </span>

                {!step.done && (
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
