import Link from 'next/link';
import { ClipboardCheck, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { auth } from '@/auth';
import { pageMetadata } from '@/lib/page-metadata';
import { getSiteSettings } from '@/lib/site-settings-server';
import SurveyForm, { type FormQuestion } from './SurveyForm';

export const metadata = pageMetadata({
  title: 'استبيان المؤتمر | مؤتمر الإبداع والابتكار',
  description: 'رأيك في مؤتمر الإبداع والابتكار — دقيقتان تصنعان الدورة القادمة.',
  // This route has its own card — opengraph-image.png beside this file — so
  // the site-wide one is left out and the file convention applies.
  image: null,
});

/**
 * Rendered per request.
 *
 * It reads whether the survey is open and which questions are being asked,
 * and both change from the panel. A prerendered page would show yesterday's
 * form — or an open one after it was closed — until the next deploy.
 */
export const dynamic = 'force-dynamic';

function Shut({ note }: { note: string }) {
  return (
    <div dir="rtl" className="mx-auto w-full max-w-xl px-4 py-24 sm:px-6">
      <div
        className="rounded-2xl p-7 text-center"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
      >
        <span
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: 'color-mix(in srgb, var(--accent-violet) 16%, transparent)' }}
        >
          <ClipboardCheck className="h-6 w-6" style={{ color: 'var(--accent-violet)' }} strokeWidth={1.6} />
        </span>

        <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          الاستبيان مغلق
        </h1>

        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {note}
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          العودة للموقع
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default async function SurveyPage() {
  const settings = await getSiteSettings();
  if (!settings.surveyOpen) return <Shut note={settings.surveyClosedNote} />;

  const questions = await prisma.surveyQuestion.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: { id: true, section: true, promptAr: true, helpAr: true, kind: true, options: true, required: true },
  });

  if (questions.length === 0) {
    return <Shut note="لم تُضَف أسئلة الاستبيان بعد. عُد إلينا قريباً." />;
  }

  // Answered already? Only knowable for somebody signed in — which is the same
  // group the unique index binds. Telling them here saves filling a form that
  // the endpoint will refuse at the end of it.
  const session = await auth();
  const already = session?.user?.id
    ? await prisma.surveyResponse.findUnique({ where: { userId: session.user.id }, select: { id: true } })
    : null;

  if (already) {
    return (
      <Shut note="شكراً — وصلتنا إجابتك على هذا الاستبيان، ونحن نقرأها. لا حاجة لإرسالها مرة أخرى." />
    );
  }

  const form: FormQuestion[] = questions.map((q) => ({
    id: q.id,
    section: q.section,
    prompt: q.promptAr,
    help: q.helpAr,
    kind: q.kind,
    options: q.options,
    required: q.required,
  }));

  return <SurveyForm questions={form} signedIn={Boolean(session?.user?.id)} />;
}
