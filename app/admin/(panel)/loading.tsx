import { SkeletonCard, SkeletonHeader, SkeletonPage, SkeletonTable } from '@/components/platform/Skeleton';

/**
 * Shown for every page under /admin while its query runs.
 *
 * One file covers the whole panel rather than one per route: the pages differ
 * in their content, but they all open with a heading and then either a row of
 * figures or a table, so a single skeleton is honest about all of them. A
 * route whose shape is genuinely different can add its own loading.tsx beside
 * its page.tsx and it will take precedence.
 */
export default function AdminPanelLoading() {
  return (
    <SkeletonPage>
      <SkeletonHeader />

      <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <SkeletonTable />
    </SkeletonPage>
  );
}
