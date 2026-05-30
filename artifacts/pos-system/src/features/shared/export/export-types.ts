export type ExportColumn<TData> = {
  key: string;
  header: string;
  value: (row: TData) => string | number;
};

export type ExportOptions<TData> = {
  filename: string;
  columns: ExportColumn<TData>[];
  rows: TData[];
};
