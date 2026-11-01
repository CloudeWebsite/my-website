/** RFC 4180 CSV with formula-injection protection for spreadsheet apps. */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          let s = cell === null || cell === undefined ? "" : String(cell);
          if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
          return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\r\n");
}
