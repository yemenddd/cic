'use client';

/**
 * A sort control that submits the form it sits in as soon as it changes.
 *
 * A Client Component because of that one handler: an `onChange` cannot be
 * attached to a DOM element from a Server Component, and the list pages that
 * use this are server-rendered. Keeping it to this control means the page
 * around it stays on the server.
 *
 * The hidden inputs are the caller's job — they are what stops choosing an
 * order from discarding the filters already applied.
 */
export default function SortSelect({
  name = 'sort',
  value,
  options,
  label = 'ترتيب النتائج',
}: {
  name?: string;
  value: string;
  options: readonly { value: string; label: string }[];
  label?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={value}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      aria-label={label}
      className="input-glass"
      style={{ padding: '6px 10px', fontSize: '12.5px', width: 'auto' }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
