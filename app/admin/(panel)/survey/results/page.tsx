import Link from 'next/link';
import { ArrowRight, ClipboardList, Download, MessageSquareQuote, Star, Users } from 'lucide-react';
import { ListPageHeader } from '@/components/admin/ListPage';
import StatCard from '@/components/admin/StatCard';
import RefreshButton from '@/components/admin/RefreshButton';
import { categoryLabel } from '@/lib/categories';
import {
  averagesByCategory, dailyCounts, questionResults, responseDates, surveyOverview,
} from '../results';
import ResultBars from '../ResultBars';
import { DailyBars, RankBars, ScaleLegend, StackedScale } from '../charts';

export const dynamic = 'force-dynamic';

/**
 * The survey as pictures.
 *
 * Separate from /admin/survey, which is where the questions are written and
 * the raw answers are read. This page answers the questions an organizer asks
 * after the conference — what scored best, what scored worst, where the room
 * disagreed with itself, and whether the volunteers saw a different conference
 * from the visitors — and each of those is a shape, not a list.
 */
export default async function SurveyChartsPage() {
  const [overview, questions, dates] = await Promise.all([
    surveyOverview(),
    questionResults(),
    responseDates(),
  ]);

  const ratingQuestions = questions.filter(
    (q) => (q.kind === 'RATING' || q.kind === 'SCALE_10') && q.result.kind === 'scale',
  );

  const headline = ratingQuestions.find((q) => q.kind === 'RATING' && q.result.kind === 'scale' && q.result.answered > 0);
  const headlineAverage = headline?.result.kind === 'scale' ? headline.result.average : null;

  const npsQuestion = questions.find((q) => q.kind === 'SCALE_10' && q.result.kind === 'scale' && q.result.nps);
  const npsValue = npsQuestion?.result.kind === 'scale' ? npsQuestion.result.nps : null;

  // Only asked when there is a headline question to split, and only shown when
  // more than one group answered it — a single bar is not a comparison.
  const byCategory = headline ? await averagesByCategory(headline.id) : [];

  const days = dailyCounts(dates);

  const rank = ratingQuestions
    .filter((q) => q.kind === 'RATING')
    .map((q) => ({
      label: q.promptAr,
      value: q.result.kind === 'scale' ? q.result.average : null,
      answered: q.result.kind === 'scale' ? q.result.answered : 0,
    }));

  return (
    <div>
      <ListPageHeader title="نتائج الاستبيان" />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/survey"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
          style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
        >
          <ArrowRight className="h-4 w-4" />
          الأسئلة والإجابات
        </Link>
        <a
          href="/admin/survey/export"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Download className="h-4 w-4" />
          تنزيل CSV
        </a>
        <RefreshButton fetchedAt={new Date().toISOString()} />
      </div>

      {overview.responses === 0 ? (
        <div
          className="rounded-2xl px-6 py-14 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--mat-liquid-bg)' }}>
            <ClipboardList className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            لا توجد إجابات بعد — تظهر الرسوم هنا فور وصول أول إجابة.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="إجابات" value={overview.responses} icon={ClipboardList} />
            <StatCard
              label="التقييم العام"
              value={headlineAverage !== null ? `${headlineAverage} / 5` : '—'}
              icon={Star}
              accent={headlineAverage !== null && headlineAverage >= 4 ? 'var(--accent-cyan)' : undefined}
            />
            <StatCard
              label="مؤشر التوصية"
              value={npsValue ? `${npsValue.score > 0 ? '+' : ''}${npsValue.score}` : '—'}
              icon={MessageSquareQuote}
              accent={npsValue && npsValue.score >= 30 ? 'var(--accent-cyan)' : npsValue && npsValue.score < 0 ? 'var(--destructive)' : undefined}
            />
            <StatCard label="أجابوا وقد حضروا" value={overview.attended} icon={Users} />
          </div>

          {/* ── what scored best, and worst ── */}
          <Panel
            title="ترتيب المحاور"
            note="أعلى متوسط أولاً. هذا هو الرسم الذي يُقرَّر منه: ما الذي نجح، وما الذي يحتاج عملاً في الدورة القادمة."
          >
            <RankBars rows={rank} max={5} />
          </Panel>

          {/* ── where the room disagreed with itself ── */}
          <Panel
            title="توزيع الإجابات"
            note="سؤالان قد يتساوى متوسطهما 3.5، أحدهما لأن الجميع كانوا محايدين والآخر لأن نصف القاعة أحبّه ونصفها لم يحبّه. هذا الرسم وحده يفرّق بينهما."
          >
            <div className="mb-4">
              <ScaleLegend max={5} />
            </div>

            <div className="space-y-3.5">
              {ratingQuestions
                .filter((q) => q.kind === 'RATING' && q.result.kind === 'scale' && q.result.answered > 0)
                .map((q) => (
                  <div key={q.id}>
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                      <p className="min-w-0 truncate text-[12.5px]" style={{ color: 'var(--text-secondary)' }} title={q.promptAr}>
                        {q.promptAr}
                      </p>
                      <p className="shrink-0 tabular-nums text-[12px]" style={{ color: 'var(--text-tertiary)' }} dir="ltr">
                        {q.result.kind === 'scale' ? `${q.result.average} · ${q.result.answered}` : ''}
                      </p>
                    </div>
                    {q.result.kind === 'scale' && (
                      <StackedScale distribution={q.result.distribution} total={q.result.answered} />
                    )}
                  </div>
                ))}
            </div>
          </Panel>

          {/* ── the recommendation question, spelled out ── */}
          {npsValue && npsQuestion && (
            <Panel
              title="مؤشر التوصية"
              note="يُحسب بطرح نسبة من لا يوصون من نسبة من يوصون. لا يُؤخذ متوسطاً لأن المتوسط يُخفي الانقسام: قاعة نصفها متحمس ونصفها محبَط تعطي نفس رقم قاعة لا مبالية."
            >
              <p className="mb-4 font-outfit text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }} dir="ltr">
                {npsValue.score > 0 ? '+' : ''}{npsValue.score}
              </p>

              <ResultBars
                total={npsValue.promoters + npsValue.passives + npsValue.detractors}
                bars={[
                  { label: 'يوصون (9–10)', count: npsValue.promoters },
                  { label: 'محايدون (7–8)', count: npsValue.passives },
                  { label: 'لا يوصون (0–6)', count: npsValue.detractors },
                ]}
              />
            </Panel>
          )}

          {/* ── did different people see different conferences ── */}
          {headline && byCategory.length > 1 && (
            <Panel
              title="التقييم العام حسب الفئة"
              note={`متوسط «${headline.promptAr}» عند كل فئة. الفرق بين الفئات هو ما لا يقوله رقم واحد.`}
            >
              <RankBars
                max={5}
                rows={byCategory.map((c) => ({
                  label: c.category === '—' ? 'بلا حساب' : categoryLabel(c.category, 'ar') || c.category,
                  value: c.average,
                  answered: c.answered,
                }))}
              />
            </Panel>
          )}

          {/* ── when they answered ── */}
          {days.length > 1 && (
            <Panel
              title="الإجابات يوماً بيوم"
              note="كل يوم بين أول إجابة وآخرها، بما فيها الأيام التي لم تصل فيها إجابة — تخطّيها يرسم تدفقاً مستمراً حيث كان هناك صمت."
            >
              <DailyBars days={days} />
            </Panel>
          )}

          {/* ── the choice questions ── */}
          {questions.filter((q) => q.result.kind === 'choice' && q.result.answered > 0).map((q) => (
            <Panel key={q.id} title={q.promptAr} note={`${q.result.answered} إجابة`}>
              {q.result.kind === 'choice' && (
                <ResultBars
                  total={q.result.answered}
                  bars={q.result.tally.map((t) => ({ label: t.option, count: t.count }))}
                />
              )}
            </Panel>
          ))}

          <p className="mt-6 text-[12px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            الإجابات النصية لا تُرسم — اقرأها في{' '}
            <Link href="/admin/survey" className="font-semibold underline" style={{ color: 'var(--text-secondary)' }}>
              صفحة الأسئلة
            </Link>
            ، أو نزّل ملف CSV وفيه كل شيء.
            {overview.anonymous > 0 && ` · ${overview.anonymous} من المجيبين بلا حساب، فلا تظهر لهم فئة.`}
          </p>
        </>
      )}
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section
      className="mb-4 rounded-2xl p-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <h2 className="font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {note && (
        <p className="mb-4 mt-1 text-[11.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {note}
        </p>
      )}
      {!note && <div className="mb-3" />}
      {children}
    </section>
  );
}
