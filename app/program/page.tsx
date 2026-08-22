import ProgramPage from '@/components/sections/ProgramPage';
import { getProgramSessions } from '@/lib/sanity/queries';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata({
  title: 'البرنامج | مؤتمر الإبداع والابتكار 2026',
  description: 'جدول أعمال مؤتمر الإبداع والابتكار 2026 — يومان، أربعة مسارات، رسالة واحدة.',
});

export default async function Program() {
  const sessions = await getProgramSessions();
  const dayOne = sessions.filter((s) => s.day === 'dayOne');
  const dayTwo = sessions.filter((s) => s.day === 'dayTwo');

  return <ProgramPage data={{ dayOne, dayTwo }} />;
}
