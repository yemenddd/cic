import type { Metadata } from 'next';
import RegisterConfirmation from '@/components/sections/RegisterConfirmation';

// Personalized page (name/code come from query params) — nothing here is
// useful for search results, and indexing it would leak registrants' names.
export const metadata: Metadata = {
  title: 'تأكيد التسجيل | مؤتمر الإبداع والابتكار',
  robots: { index: false, follow: false },
};

export default function ConfirmationPage() {
  return <RegisterConfirmation />;
}
