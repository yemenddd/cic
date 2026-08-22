import VideosPage from '@/components/sections/VideosPage';
import { getVideos } from '@/lib/sanity/queries';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata({
  title: 'الأفلام والوثائقيات | مؤتمر الإبداع والابتكار',
  description: 'الأرشيف الكامل للأفلام الرسمية وملخصات دورات مؤتمر الإبداع والابتكار.',
});

export default async function Videos() {
  const [filmData, tvData] = await Promise.all([getVideos('film'), getVideos('tv')]);

  return <VideosPage filmData={filmData} tvData={tvData} />;
}
