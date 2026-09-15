import Link from 'next/link';
import { Mic2, CalendarDays, Images, Handshake, History, Trophy, Clapperboard, ClipboardList } from 'lucide-react';
import { prisma } from '@/lib/db/client';

const CARDS = [
  { href: '/admin/speakers', label: 'المتحدثون', icon: Mic2, count: () => prisma.speaker.count() },
  { href: '/admin/program', label: 'جلسات البرنامج', icon: CalendarDays, count: () => prisma.programSession.count() },
  { href: '/admin/gallery', label: 'صور المعرض', icon: Images, count: () => prisma.galleryImage.count() },
  { href: '/admin/partners', label: 'الشركاء', icon: Handshake, count: () => prisma.partner.count() },
  { href: '/admin/history', label: 'دورات المؤتمر', icon: History, count: () => prisma.historyEdition.count() },
  { href: '/admin/achievements', label: 'إنجازات الطلاب', icon: Trophy, count: () => prisma.achievementStudent.count() },
  { href: '/admin/videos', label: 'الفيديوهات', icon: Clapperboard, count: () => prisma.video.count() },
  { href: '/admin/registrations', label: 'التسجيلات', icon: ClipboardList, count: () => prisma.registration.count() },
];

export default async function AdminHomePage() {
  const counts = await Promise.all(CARDS.map((c) => c.count()));

  return (
    <div>
      <h1 className="font-outfit font-bold text-xl mb-6" style={{ color: 'var(--text-primary)' }}>نظرة عامة</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CARDS.map(({ href, label, icon: Icon }, i) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl p-5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
          >
            <Icon className="h-5 w-5 mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p className="font-outfit font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{counts[i]}</p>
            <p className="text-[12.5px] mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
