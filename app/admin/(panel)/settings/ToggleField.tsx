'use client';

import { useState } from 'react';

/**
 * A switch that posts like a checkbox.
 *
 * The shared field set has no boolean control, and the one thing this settings
 * page has to get unambiguously right is whether registration is open — a
 * state read by both the form and the route. A styled `<input type="checkbox">`
 * keeps the native semantics (label, keyboard, `on` in the FormData) and only
 * changes what it looks like.
 */
export default function ToggleField({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useState(Boolean(defaultChecked));

  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        onChange={(e) => setOn(e.target.checked)}
        className="peer sr-only"
      />

      <span
        aria-hidden
        className="mt-0.5 flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-200 peer-focus-visible:outline peer-focus-visible:outline-2"
        style={{
          background: on ? 'var(--accent-cyan)' : 'var(--mat-liquid-bg)',
          border: `1px solid ${on ? 'transparent' : 'var(--mat-liquid-border)'}`,
          justifyContent: on ? 'flex-end' : 'flex-start',
        }}
      >
        <span
          className="block h-[14px] w-[14px] rounded-full transition-transform duration-200"
          style={{ background: on ? '#fff' : 'var(--text-tertiary)' }}
        />
      </span>

      <span className="min-w-0">
        <span className="block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        {description && (
          <span
            className="mt-1 block text-[11.5px] leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
