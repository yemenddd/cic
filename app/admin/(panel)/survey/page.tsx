import Link from 'next/link';
import { BarChart3, ClipboardList, Download, MessageSquareQuote, Star, Users } from 'lucide-react';
import { ListPageHeader } from '@/components/admin/ListPage';
import StatCard from '@/components/admin/StatCard';
import RefreshButton from '@/components/admin/RefreshButton';
import { categoryLabel } from '@/lib/categories';
import { getSiteSettings } from '@/lib/site-settings-server';
import { siteUrl } from '@/lib/site';
import { scaleOf } from '@/lib/survey';
import { questionResults, surveyOverview } from './results';
import {
  addQuestion, deleteQuestion, moveQuestion, restoreDefaultQuestions,
  setQuestionActive, setQuestionRequired, setSurveyOpen, updateQuestion,
} from './actions';
import QuestionManager, { type ManagedQuestion } from './QuestionManager';
import SurveyControls from './SurveyControls';
import ResultBars from './ResultBars';
import RestoreDefaults from './RestoreDefaults';

export const dynamic = 'force-dynamic';

const WHEN = new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short' });

export default async function AdminSurveyPage() {
  const [overview, questions, settings] = await Promise.all([
    surveyOverview(),
    questionResults(),
    getSiteSettings(),
  ]);

  // The headline rating is the first required question on a 1–5 scale, which
  // is the one the whole survey is built around. Found rather than hardcoded,
  // because an organizer can rewrite the question list.
  const headline = questions.find((q) => q.kind === 'RATING' && q.result.kind === 'scale' && q.result.answered > 0);
  const headlineAverage = headline?.result.kind === 'scale' ? headline.result.average : null;

  const npsQuestion = questions.find((q) => q.kind === 'SCALE_10' && q.result.kind === 'scale' && q.result.nps);
  const npsValue = npsQuestion?.result.kind === 'scale' ? npsQuestion.result.nps : null;

  const managed: ManagedQuestion[] = questions.map((q) => ({
    id: q.id,
    section: q.section,
    promptAr: q.promptAr,
    helpAr: q.helpAr,
    kind: q.kind,
    options: q.options,
    required: q.required,
    active: q.active,
    answerCount: q.answerCount,
  }));

  const sections = [...new Set(questions.map((q) => q.section))];

  return (
    <div>
      <ListPageHeader title="الاستبيان" />

      <p className="text-[13px] leading-relaxed mb-5 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
        رأي الحاضرين في المؤتمر — الأسئلة تُكتب هنا، والنتائج تُقرأ هنا. النموذج مفتوح لمن لا
        يملك حساباً أيضاً، لأن أغلب من حضر سُجّل عند الباب ولا يستطيع تسجيل الدخول.
      </p>

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
          hint={npsValue ? `${npsValue.promoters} يوصون · ${npsValue.detractors} لا` : undefined}
        />
        <StatCard
          label="أجابوا وقد حضروا"
          value={overview.attended}
          icon={Users}
          hint={overview.responses > 0 ? `من ${overview.responses} إجابة` : undefined}
        />
      </div>

      <SurveyControls
        open={settings.surveyOpen}
        note={settings.surveyClosedNote}
        url={`${siteUrl}/survey`}
        activeQuestions={questions.filter((q) => q.active).length}
        onSave={setSurveyOpen}
      />

      <div className="mt-5 mb-4 flex flex-wrap items-center gap-2">
        <a
          href="/admin/survey/export"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Download className="h-4 w-4" />
          تنزيل النتائج CSV
        </a>

        {/* The pictures live on their own page: this one is for writing the
            questions and reading what people wrote back. */}
        <Link
          href="/admin/survey/results"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
          style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
        >
          <BarChart3 className="h-4 w-4" />
          النتائج بالرسوم
        </Link>

        <RefreshButton fetchedAt={new Date().toISOString()} />

        {overview.last && (
          <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            آخر إجابة: {WHEN.format(overview.last)}
          </p>
        )}
      </div>

      {overview.responses > 0 && overview.byCategory.length > 0 && (
        <div
          className="mb-6 rounded-2xl p-5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <h2 className="mb-3 font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
            من أجاب
          </h2>
          <ResultBars
            total={overview.responses}
            bars={[
              ...overview.byCategory.map((c) => ({
                label: c.category === '—' ? 'بلا حساب' : categoryLabel(c.category, 'ar') || c.category,
                count: c.count,
              })),
            ]}
          />
          <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            {overview.anonymous} إجابة بلا تسجيل دخول — هؤلاء لا تُعرف فئتهم، وأغلبهم ممن سُجّل عند الباب.
          </p>
        </div>
      )}

      <h2 className="font-outfit font-bold text-[15px] mt-8 mb-4" style={{ color: 'var(--text-primary)' }}>
        النتائج
      </h2>

      {overview.responses === 0 ? (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'var(--mat-liquid-bg)' }}
          >
            <ClipboardList className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            لم تصل أي إجابة بعد
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <section
              key={q.id}
              className="rounded-2xl p-5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)', opacity: q.active ? 1 : 0.65 }}
            >
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>{q.section}</p>
                  <h3 className="mt-0.5 text-[14px] font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {q.promptAr}
                    {!q.active && <span className="text-[11.5px] font-normal" style={{ color: 'var(--text-tertiary)' }}> · موقوف</span>}
                  </h3>
                </div>

                <p className="shrink-0 text-[12px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                  {q.result.answered} إجابة
                  {q.result.kind === 'scale' && q.result.average !== null && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {' · متوسط '}
                      <span className="font-semibold">{q.result.average}</span>
                      {scaleOf(q.kind) ? ` / ${scaleOf(q.kind)!.max}` : ''}
                    </span>
                  )}
                </p>
              </div>

              {q.result.kind === 'scale' && (
                <>
                  <ResultBars
                    total={q.result.answered}
                    bars={q.result.distribution.map((d) => ({ label: String(d.value), count: d.count, numeric: true }))}
                  />
                  {q.result.nps && (
                    <p className="mt-3 text-[12px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                      مؤشر التوصية {q.result.nps.score > 0 ? '+' : ''}{q.result.nps.score} —
                      {' '}{q.result.nps.promoters} يوصون (9–10)،
                      {' '}{q.result.nps.passives} محايدون (7–8)،
                      {' '}{q.result.nps.detractors} لا يوصون (0–6).
                    </p>
                  )}
                </>
              )}

              {q.result.kind === 'choice' && (
                <ResultBars
                  total={q.result.answered}
                  bars={q.result.tally.map((t) => ({ label: t.option, count: t.count }))}
                />
              )}

              {q.result.kind === 'text' && (
                q.result.answered === 0 ? (
                  <p className="py-4 text-center text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
                    لا توجد إجابات بعد
                  </p>
                ) : (
                  <div className="space-y-2">
                    {q.result.samples.map((s, i) => (
                      <p
                        key={i}
                        className="rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                        style={{ background: 'var(--mat-liquid-bg)', color: 'var(--text-secondary)' }}
                      >
                        {s.text}
                      </p>
                    ))}
                    {q.result.answered > q.result.samples.length && (
                      <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                        وأكثر — {q.result.answered} إجابة في المجمل، كلها في ملف CSV.
                      </p>
                    )}
                  </div>
                )
              )}
            </section>
          ))}
        </div>
      )}

      <h2 className="font-outfit font-bold text-[15px] mt-10 mb-4" style={{ color: 'var(--text-primary)' }}>
        الأسئلة
      </h2>

      {questions.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-10 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <p className="text-[13px] mb-4" style={{ color: 'var(--text-tertiary)' }}>
            لا توجد أسئلة. ابدأ بمجموعة جاهزة تغطي الجلسات والحفلين والتنظيم، ثم عدّلها كما تشاء.
          </p>
          <RestoreDefaults onRestore={restoreDefaultQuestions} />
        </div>
      ) : (
        <QuestionManager
          questions={managed}
          sections={sections}
          addAction={addQuestion}
          updateAction={updateQuestion}
          deleteAction={deleteQuestion}
          onToggleActive={setQuestionActive}
          onToggleRequired={setQuestionRequired}
          onMove={moveQuestion}
        />
      )}
    </div>
  );
}
