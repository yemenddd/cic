import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EditionAchievements from '@/components/sections/EditionAchievements';
import { ACHIEVEMENT_EDITIONS } from '@/lib/achievements-data';

interface Props {
  params: Promise<{ edition: string }>;
}

export async function generateStaticParams() {
  return ACHIEVEMENT_EDITIONS.map(e => ({ edition: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { edition } = await params;
  const ed = ACHIEVEMENT_EDITIONS.find(e => e.slug === edition);
  if (!ed) return {};
  return {
    title: `إنجازات الدورة ${ed.number === 1 ? 'الأولى' : ed.number === 2 ? 'الثانية' : 'الثالثة'} | CICT`,
    description: `استعرض إنجازات الطلاب المبتكرين والمشاركين في الدورة ${ed.year}.`,
  };
}

export default async function EditionPage({ params }: Props) {
  const { edition } = await params;
  const exists = ACHIEVEMENT_EDITIONS.some(e => e.slug === edition);
  if (!exists) notFound();
  return <EditionAchievements slug={edition} />;
}
