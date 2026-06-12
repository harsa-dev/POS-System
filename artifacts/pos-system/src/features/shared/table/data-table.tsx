import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<TData> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: TData) => ReactNode;
};

export function DataTable<TData>({
  columns,
  data,
  getRowKey,
  minWidth = 900,
  emptyMessage = "No data found.",
}: {
  columns: DataTableColumn<TData>[];
  data: TData[];
  getRowKey: (row: TData) => string;
  minWidth?: number;
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="border-b border-border bg-muted text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn("px-4 py-3 font-semibold", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-b border-border transition-colors hover:bg-muted/50"
            >
              {columns.map((column) => (
                <td key={column.key} className={cn("px-4 py-4", column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
