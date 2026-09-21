import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EditionAchievements from '@/components/sections/EditionAchievements';
import { ACHIEVEMENT_EDITIONS } from '@/lib/achievements-data';
import { getAchievementEditions, getAchievementStudents } from '@/lib/db/queries';
import { pageMetadata } from '@/lib/page-metadata';

interface Props {
  params: Promise<{ edition: string }>;
}

export async function generateStaticParams() {
  const editions = await getAchievementEditions();
  if (editions.length > 0) {
    return editions.map(e => ({ edition: e.slug }));
  }
  return ACHIEVEMENT_EDITIONS.map(e => ({ edition: e.slug }));
}

async function findEdition(slug: string): Promise<{ number: number; year: number | string } | null> {
  const editions = await getAchievementEditions();
  const dbEd = editions.find(e => e.slug === slug);
  if (dbEd) return { number: dbEd.number, year: dbEd.year };
  const localEd = ACHIEVEMENT_EDITIONS.find(e => e.slug === slug);
  if (localEd) return { number: localEd.number, year: localEd.year };
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { edition } = await params;
  const ed = await findEdition(edition);
  if (!ed) return {};
  return pageMetadata({
    title: `إنجازات الدورة ${ed.number === 1 ? 'الأولى' : ed.number === 2 ? 'الثانية' : 'الثالثة'} | CIC`,
    description: `استعرض إنجازات الطلاب المبتكرين والمشاركين في الدورة ${ed.year}.`,
  });
}

export default async function EditionPage({ params }: Props) {
  const { edition } = await params;
  const ed = await findEdition(edition);
  if (!ed) notFound();
  const students = await getAchievementStudents(edition);
  return <EditionAchievements slug={edition} data={students} />;
}
