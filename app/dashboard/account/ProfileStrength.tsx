'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, CircleAlert, Circle } from 'lucide-react';
import Gauge from '@/components/platform/Gauge';
import {
  profileCompleteness, type ProfileFields, type ProfileCompleteness,
} from '@/lib/profile-completeness';

/**
 * How complete this profile is, recomputed as the form is typed into.
 *
 * It listens to its own enclosing form rather than owning the inputs. The
 * fields here are the shared uncontrolled `TextField`s used across the whole
 * panel; lifting their values into React state to feed a progress meter would
 * have meant a controlled variant of every one of them, on every form, so that
 * this page could draw a ring. Reading `new FormData(form)` on input gives the
 * same answer and leaves those components alone.
 *
 * `initial` is what the server rendered, so the ring is right in the markup
 * before any of this runs, and stays right if it never does.
 */
export default function ProfileStrength({ initial }: { initial: ProfileFields }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ProfileCompleteness>(() => profileCompleteness(initial));

  useEffect(() => {
    const form = hostRef.current?.closest('form');
    if (!form) return;

    const read = () => {
      const data = new FormData(form);
      const value = (k: string) => {
        const v = data.get(k);
        return typeof v === 'string' ? v : null;
      };
      setState(
        profileCompleteness({
          name: value('name'),
          phone: value('phone'),
          country: value('country'),
          organization: value('organization'),
          track: value('track'),
        }),
      );
    };

    // `input` covers typing; `change` covers the select, which does not emit
    // `input` in every browser this has to work in.
    form.addEventListener('input', read);
    form.addEventListener('change', read);
    read();
    return () => {
      form.removeEventListener('input', read);
      form.removeEventListener('change', read);
    };
  }, []);

  const complete = state.filled === state.total;

  return (
    <div
      ref={hostRef}
      className="rounded-xl p-4"
      style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <div className="flex items-center gap-4">
        <Gauge
          value={state.ratio}
          label={`${state.filled}`}
          caption={`من ${state.total}`}
          size={78}
          color={complete ? 'var(--accent-cyan)' : 'var(--accent-violet)'}
          ariaLabel={`اكتملت ${state.filled} من ${state.total} من بيانات ملفك`}
        />

        <div className="min-w-0 flex-1">
          <p className="font-outfit font-bold text-[13.5px]" style={{ color: 'var(--text-primary)' }}>
            {complete ? 'بياناتك مكتملة' : 'اكتمال بياناتك'}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            {complete
              ? 'كل ما يُطبع على بطاقتك وشهادتك موجود.'
              : state.missingEssential.length > 0
                ? `ينقصك ${state.missingEssential.map((i) => i.label).join(' و')} — وهو مما يُطبع.`
                : 'الأساسي مكتمل. الباقي يجعل بطاقتك أوضح لمن يقابلك.'}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {state.items.map((item) => {
          const Icon = item.filled ? Check : item.essential ? CircleAlert : Circle;
          const tone = item.filled
            ? 'var(--accent-cyan)'
            : item.essential
              ? 'var(--accent-violet)'
              : 'var(--text-tertiary)';
          return (
            <li key={item.key} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: tone }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[12.5px] font-semibold"
                  style={{
                    color: item.filled ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: item.filled ? 'none' : undefined,
                  }}
                >
                  {item.label}
                </span>
                {/* The reason stays visible whether or not the field is filled:
                    it is the answer to "why does this matter", which is as
                    useful when deciding to correct a value as when adding one. */}
                <span className="block text-[11.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  {item.why}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
