'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';

// Minimal shape shared by every orderable model's Prisma delegate. Each model
// is cast to this once in MODELS below, which keeps the swap logic generic
// while still type-checking every call site.
interface OrderableDelegate {
  findUnique(args: { where: { id: string } }): Promise<Record<string, unknown> | null>;
  findFirst(args: {
    where: Record<string, unknown>;
    orderBy: { order: 'asc' | 'desc' };
  }): Promise<Record<string, unknown> | null>;
  update(args: { where: { id: string }; data: { order: number } }): Promise<unknown>;
}

// Accepts both the plain client and the transaction client, so the same
// delegate lookup works inside and outside a transaction.
type DbLike = Pick<
  typeof prisma,
  'speaker' | 'programSession' | 'galleryImage' | 'partner'
  | 'historyEdition' | 'video' | 'achievementEdition' | 'achievementStudent'
>;

// `model` arrives from the client, so it's only ever used as a key into this
// allowlist — never passed through to Prisma directly.
const MODELS = {
  speaker: {
    delegate: (c: DbLike) => c.speaker as unknown as OrderableDelegate,
    revalidate: ['/'],
    scopeField: null,
  },
  programSession: {
    delegate: (c: DbLike) => c.programSession as unknown as OrderableDelegate,
    revalidate: ['/program'],
    scopeField: 'day',
  },
  galleryImage: {
    delegate: (c: DbLike) => c.galleryImage as unknown as OrderableDelegate,
    revalidate: ['/gallery'],
    scopeField: null,
  },
  partner: {
    delegate: (c: DbLike) => c.partner as unknown as OrderableDelegate,
    revalidate: ['/'],
    scopeField: null,
  },
  historyEdition: {
    delegate: (c: DbLike) => c.historyEdition as unknown as OrderableDelegate,
    revalidate: ['/history'],
    scopeField: null,
  },
  video: {
    delegate: (c: DbLike) => c.video as unknown as OrderableDelegate,
    revalidate: ['/videos'],
    scopeField: 'section',
  },
  achievementEdition: {
    delegate: (c: DbLike) => c.achievementEdition as unknown as OrderableDelegate,
    revalidate: ['/achievements'],
    scopeField: null,
  },
  achievementStudent: {
    delegate: (c: DbLike) => c.achievementStudent as unknown as OrderableDelegate,
    revalidate: ['/achievements'],
    scopeField: 'editionId',
  },
} as const;

export type OrderableModel = keyof typeof MODELS;

export async function moveItem(
  model: OrderableModel,
  id: string,
  direction: 'up' | 'down',
): Promise<void> {
  const config = MODELS[model];
  if (!config) return;

  const moved = await prisma.$transaction(async (tx) => {
    const delegate = config.delegate(tx);

    const current = await delegate.findUnique({ where: { id } });
    if (!current) return false;
    const currentOrder = current.order as number;

    // Only swap within the same group — a session moves within its day, a
    // student within their edition, and so on.
    const scope: Record<string, unknown> = config.scopeField
      ? { [config.scopeField]: current[config.scopeField] }
      : {};

    const neighbour = await delegate.findFirst({
      where: {
        ...scope,
        order: direction === 'up' ? { lt: currentOrder } : { gt: currentOrder },
      },
      orderBy: { order: direction === 'up' ? 'desc' : 'asc' },
    });
    if (!neighbour) return false; // already at the top/bottom of its group

    await delegate.update({ where: { id }, data: { order: neighbour.order as number } });
    await delegate.update({ where: { id: neighbour.id as string }, data: { order: currentOrder } });
    return true;
  });

  if (!moved) return;

  for (const path of config.revalidate) revalidatePath(path);
  revalidatePath('/admin', 'layout');
}
