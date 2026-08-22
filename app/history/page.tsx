import HistoryTimeline from '@/components/sections/HistoryTimeline';
import { getHistoryEditions } from '@/lib/sanity/queries';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata({
  title: 'رحلتنا | مؤتمر الإبداع والابتكار 2026',
  description: 'أربع دورات، رؤية واحدة — استعرض مسيرة مؤتمر الإبداع والابتكار.',
});

export default async function HistoryPage() {
  const editions = await getHistoryEditions();

  return (
    <div>
      <HistoryTimeline data={editions} />
    </div>
  );
}
