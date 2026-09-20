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

export function toCsv(header: string[], rows: CsvValue[][]): string {
  const lines = [header.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))];

  // The BOM is what makes Excel read the file as UTF-8. Without it, Excel
  // guesses the system code page and every Arabic name in the file opens as
  // mojibake — which reads as data loss to whoever is handed the spreadsheet.
  // CRLF for the same reason: it is what Excel writes, and what it expects.
  return `﻿${lines.join('\r\n')}`;
}
