export type SelectFilterOption = string | {
  value: string;
  label: string;
};

function getOptionValue(option: SelectFilterOption) {
  return typeof option === "string" ? option : option.value;
}

function getOptionLabel(option: SelectFilterOption) {
  return typeof option === "string" ? option : option.label;
}

export function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectFilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-10 min-w-0 items-center rounded-lg border border-border bg-card px-3 text-card-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-sm outline-none"
      >
        {options.map((option) => {
          const optionValue = getOptionValue(option);

          return (
            <option key={optionValue} value={optionValue}>
              {getOptionLabel(option)}
            </option>
          );
        })}
      </select>
    </label>
  );
}
