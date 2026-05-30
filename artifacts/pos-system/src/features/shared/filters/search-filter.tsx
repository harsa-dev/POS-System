import { Search } from "lucide-react";

export function SearchFilter({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3">
      <span className="sr-only">{label}</span>
      <Search className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
      />
    </label>
  );
}
