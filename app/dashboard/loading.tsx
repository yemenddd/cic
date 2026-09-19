import { SkeletonCard, SkeletonHeader, SkeletonPage } from '@/components/platform/Skeleton';

/**
 * Shown for every page under /dashboard while its query runs.
 *
 * The attendee's pages are cards rather than tables, so this leans on the
 * two-column card grid the dashboard, agenda and innovations pages all use.
 */
export default function DashboardLoading() {
  return (
    <SkeletonPage>
      <SkeletonHeader />

      <div className="space-y-5">
        <SkeletonCard height={132} />
        <div className="grid gap-5 lg:grid-cols-2">
          <SkeletonCard height={180} />
          <SkeletonCard height={180} />
        </div>
      </div>
    </SkeletonPage>
  );
}
