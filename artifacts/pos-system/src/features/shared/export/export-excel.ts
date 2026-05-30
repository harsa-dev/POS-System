import { buildCsv } from "./export-csv";
import type { ExportOptions } from "./export-types";

export function exportExcel<TData>(options: ExportOptions<TData>) {
  const csv = buildCsv(options);
  const blob = new Blob([csv], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = options.filename.endsWith(".xls")
    ? options.filename
    : `${options.filename}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}
