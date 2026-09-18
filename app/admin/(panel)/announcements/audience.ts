import { CATEGORIES } from '@/lib/categories';

// Kept out of actions.ts because a 'use server' module may only export async
// functions — a plain constant or a sync helper there is a build error.

export const AUDIENCE_ALL = 'all';

/** Who an announcement can be aimed at: everyone, or one benefit tier. */
export function audienceOptions() {
  return [
    { value: AUDIENCE_ALL, label: 'كل المشاركين' },
    ...CATEGORIES.map((c) => ({ value: c.id, label: `فئة «${c.labels.ar}» فقط` })),
  ];
}

export function audienceLabel(audience: string): string {
  return audienceOptions().find((o) => o.value === audience)?.label ?? audience;
}
