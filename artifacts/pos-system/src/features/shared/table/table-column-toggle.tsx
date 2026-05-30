export type ToggleableColumn = {
  key: string;
  label: string;
};

export function TableColumnToggle({
  columns,
  visibleColumns,
  onToggle,
}: {
  columns: ToggleableColumn[];
  visibleColumns: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Columns
      </p>
      <div className="grid gap-2">
        {columns.map((column) => (
          <label key={column.key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={visibleColumns.includes(column.key)}
              onChange={() => onToggle(column.key)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span>{column.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
