import { SelectFilter } from "./select-filter";

export function CategoryFilter({
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
      label="Category"
      value={value}
      options={options}
      onChange={onChange}
    />
  );
}
