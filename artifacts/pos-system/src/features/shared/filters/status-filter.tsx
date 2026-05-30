import { SelectFilter } from "./select-filter";

export function StatusFilter({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <SelectFilter
      label="Status"
      value={value}
      options={options}
      onChange={onChange}
    />
  );
}
