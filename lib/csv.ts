/**
 * CSV for the admin panel's exports.
 *
 * Small, but shared on purpose: every one of these files is opened in Excel,
 * and the details that decide whether the trip is safe — the byte order mark,
 * CRLF line endings, and the formula guard below — are exactly the details
 * each export would otherwise get subtly wrong on its own.
 */

export type CsvValue = string | number | null | undefined;

/**
 * Characters that make a spreadsheet treat a cell as a formula rather than
 * text. `-` and `+` are here because a cell like `-1+1` is arithmetic, and `@`
 * because it introduces a function reference in older Excel.
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/**
 * Stop a cell being executed when the file is opened.
 *
 * Every string in these exports came from a registration form that anybody on
 * the internet can submit. Without this, someone registering as
 * `=cmd|'/c calc'!A1` — or the tamer `=HYPERLINK(...)` that exfiltrates the
 * row it sits in — hands that payload to whichever organiser opens the
 * spreadsheet. The name is data; the spreadsheet was treating it as code.
 *
 * A leading apostrophe is the standard defence: Excel, LibreOffice and Sheets
 * all read it as "the rest of this cell is literal text" and do not display
 * it. The value is unchanged for anything that does not start dangerously.
 */
function neutralizeFormula(raw: string): string {
  return FORMULA_LEAD.test(raw) ? `'${raw}` : raw;
}

/** Quote a cell only when it would otherwise break the row. */
export function csvCell(value: CsvValue): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const safe = neutralizeFormula(raw);
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** One row, already escaped. */
export function csvLine(values: CsvValue[]): string {
  return values.map(csvCell).join(',');
}

/**
 * The BOM is what makes Excel read the file as UTF-8. Without it, Excel
 * guesses the system code page and every Arabic name in the file opens as
 * mojibake — which reads as data loss to whoever is handed the spreadsheet.
 * CRLF for the same reason: it is what Excel writes, and what it expects.
 */
const BOM = '﻿';
const CRLF = '\r\n';

export function toCsv(header: string[], rows: CsvValue[][]): string {
  return BOM + [csvLine(header), ...rows.map(csvLine)].join(CRLF);
}

/**
 * An export as a streamed response.
 *
 * The exports used to build the whole file in memory before sending a byte of
 * it, which made their memory cost a straight multiple of the number of
 * attendees: measured at roughly 1.45 KB per account, so 250,000 attendees
 * meant a 368 MB heap inside a function limited to 1 GB, and half a million
 * meant 729 MB. It would have died in the same way each time — during the
 * conference, on the day the list is worth exporting.
 *
 * Pulling one page at a time makes the cost constant instead: only the page
 * being written is ever held. `pull` is what does it — the stream asks for the
 * next page when the client is ready for it, so a slow download applies
 * backpressure all the way to the database rather than filling a buffer.
 */
export function csvResponse(
  filename: string,
  header: string[],
  pages: AsyncIterable<CsvValue[][]>,
): Response {
  const encoder = new TextEncoder();
  const iterator = pages[Symbol.asyncIterator]();

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(BOM + csvLine(header)));
    },
    async pull(controller) {
      try {
        // Loops rather than returning after one page, because a `pull` that
        // enqueues nothing is not guaranteed to be called again — an empty
        // page in the middle would leave the download hanging open forever,
        // which is exactly how the first version of this failed.
        for (;;) {
          const { value, done } = await iterator.next();
          if (done) {
            controller.close();
            return;
          }
          if (value.length > 0) {
            controller.enqueue(encoder.encode(CRLF + value.map(csvLine).join(CRLF)));
            return;
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
    async cancel() {
      // The download was abandoned — stop querying for pages nobody will read.
      await iterator.return?.();
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // Never cached: a snapshot of personal data behind an auth check.
      'Cache-Control': 'no-store',
    },
  });
}
