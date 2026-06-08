import type { Metadata } from 'next';
import AchievementsPage from '@/components/sections/AchievementsPage';

export const metadata: Metadata = {
  title: 'إنجازاتنا | مؤتمر الإبداع والابتكار',
  description: 'إنجازات الطلاب المبتكرين والمشاركين عبر دورات مؤتمر الإبداع والابتكار.',
};

export default function Achievements() {
  return <AchievementsPage />;
}
