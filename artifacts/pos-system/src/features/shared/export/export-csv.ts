import type { ExportOptions } from "./export-types";

function escapeCsvValue(value: string | number) {
  const stringValue = String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function buildCsv<TData>({ columns, rows }: ExportOptions<TData>) {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvValue(column.value(row))).join(","),
  );

  return [header, ...body].join("\r\n");
}

export function exportCsv<TData>(options: ExportOptions<TData>) {
  const csv = buildCsv(options);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = options.filename.endsWith(".csv")
    ? options.filename
    : `${options.filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
