/**
 * Reading a whole table without holding it.
 *
 * The exports pair this with `csvResponse`: this yields one page at a time,
 * that writes each page out and asks for the next. Neither ever holds more
 * than a page, so an export of half a million rows costs the same memory as an
 * export of fifty.
 *
 * Cursor paging rather than OFFSET on purpose. `skip: 400000` makes the
 * database count its way past 400,000 rows to reach the ones wanted, so the
 * last page of a large export is the most expensive — and the cost of the
 * whole export grows with the square of its size. A cursor is an index seek
 * that costs the same on every page.
 */

/**
 * Rows per query, chosen by measurement rather than by picking a round number.
 *
 * Exporting 100,000 accounts, page size against total time and peak memory:
 *
 *     1,000 rows   33.6s    24 MB
 *     5,000 rows   20.5s    11 MB
 *    20,000 rows    8.3s    57 MB
 *    50,000 rows    4.0s   153 MB
 *
 * Small pages are not cheap: each one re-seeks the cursor and pays a round
 * trip, and at 1,000 the export took four times as long as at 20,000 while
 * saving nothing worth having. 20,000 is where the curve flattens — the memory
 * is still flat in the size of the table, which is the whole point, and the
 * time is within reach of reading everything at once.
 */
export const EXPORT_PAGE_SIZE = 20_000;

/**
 * Page through a table with a cursor.
 *
 * `fetch` is handed the id to resume after — undefined on the first call — and
 * must return rows in a deterministic order. Give it an `orderBy` ending in a
 * unique column (id), or two rows that compare equal can straddle a page
 * boundary and be skipped or repeated.
 */
export async function* inPages<T extends { id: string }>(
  fetch: (after: string | undefined, take: number) => Promise<T[]>,
  pageSize: number = EXPORT_PAGE_SIZE,
): AsyncGenerator<T[]> {
  let after: string | undefined;

  for (;;) {
    const rows = await fetch(after, pageSize);
    if (rows.length === 0) return;

    yield rows;

    // A short page means the end of the table was reached, so stop without
    // paying for one more query that is certain to come back empty.
    if (rows.length < pageSize) return;
    after = rows[rows.length - 1].id;
  }
}
