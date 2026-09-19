/**
 * CSV for the admin panel's exports.
 *
 * Small, but shared on purpose: every one of these files is opened in Excel,
 * and the two details that decide whether Arabic survives that trip — the byte
 * order mark and CRLF line endings — are exactly the details each export
 * would otherwise get subtly wrong on its own.
 */

export type CsvValue = string | number | null | undefined;

/** Quote a cell only when it would otherwise break the row. */
export function csvCell(value: CsvValue): string {
  const raw = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

export function toCsv(header: string[], rows: CsvValue[][]): string {
  const lines = [header.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))];

  // The BOM is what makes Excel read the file as UTF-8. Without it, Excel
  // guesses the system code page and every Arabic name in the file opens as
  // mojibake — which reads as data loss to whoever is handed the spreadsheet.
  // CRLF for the same reason: it is what Excel writes, and what it expects.
  return `﻿${lines.join('\r\n')}`;
}
