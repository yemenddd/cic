/**
 * The bits of list-page plumbing that every panel list needs and none of them
 * should be reimplementing: how big a page is, how to read a page number that
 * somebody may have typed into the URL, and how to build the link back.
 *
 * lib/admin-users.ts is the richer, directory-specific version of the same
 * idea; this is what is left once the user-only filters are taken out of it.
 */

/** Rows per page. Large enough to scan, small enough to stay one query. */
export const LIST_PAGE_SIZE = 25;

/**
 * A page number from a query string.
 *
 * Anything that is not a positive integer is page one, and absurd values are
 * clamped rather than turned into an `OFFSET 999999999` the database has to
 * count its way through.
 */
export function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1;
}

export function pageCountFor(total: number, pageSize: number = LIST_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Build a list URL from whatever is currently applied.
 *
 * Empty values are dropped so the address bar shows only the filters that are
 * actually doing something, and page 1 is left implicit — `?page=1` on every
 * link makes two URLs for one view.
 */
export function listHref(
  basePath: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'page' && Number(value) <= 1) continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}
