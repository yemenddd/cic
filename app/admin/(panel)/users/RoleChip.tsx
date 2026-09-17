import type { UserRole } from '@prisma/client';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'مدير',
  ATTENDEE: 'مشارك',
};

// Only CSS custom properties — both tokens are defined for the light and the
// dark theme, so the chip stays legible in either.
const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'var(--accent-violet)',
  ATTENDEE: 'var(--text-tertiary)',
};

export default function RoleChip({ role }: { role: UserRole }) {
  const color = ROLE_COLORS[role];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
