import HistoryTimeline from '@/components/sections/HistoryTimeline';

export const metadata = {
  title: 'رحلتنا | مؤتمر الإبداع والابتكار 2026',
  description: 'أربع دورات، رؤية واحدة — استعرض مسيرة مؤتمر الإبداع والابتكار.',
};

export default function HistoryPage() {
  return (
    <div>
      <HistoryTimeline />
    </div>
  );
}
