import type { Metadata } from 'next';
import PrivacyPage from '@/components/sections/PrivacyPage';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | مؤتمر الإبداع والابتكار 2026',
  description: 'كيف يجمع مؤتمر الإبداع والابتكار بيانات التسجيل ويستخدمها ويحميها.',
  robots: { index: true, follow: true },
};

export default function Privacy() {
  return <PrivacyPage />;
}
