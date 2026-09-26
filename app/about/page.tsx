import AboutPage from '@/components/sections/AboutPage';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata({
  title: 'عن المؤتمر | مؤتمر الإبداع والابتكار',
  description: 'تعرّف على قصة مؤتمر الإبداع والابتكار، رسالته، وقيمه الأساسية.',
});

export default function About() {
  return (
    <div>
      <AboutPage />
    </div>
  );
}
