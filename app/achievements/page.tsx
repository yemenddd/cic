import AchievementsPage from '@/components/sections/AchievementsPage';
import { getAchievementEditions } from '@/lib/sanity/queries';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata({
  title: 'إنجازاتنا | مؤتمر الإبداع والابتكار',
  description: 'إنجازات الطلاب المبتكرين والمشاركين عبر دورات مؤتمر الإبداع والابتكار.',
});

export default async function Achievements() {
  const editions = await getAchievementEditions();
  return <AchievementsPage data={editions} />;
}
