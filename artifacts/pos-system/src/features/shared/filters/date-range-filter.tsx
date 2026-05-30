import { CalendarDays } from "lucide-react";

import { SelectFilter } from "./select-filter";
import type { DateRangeOption } from "@/features/shared/types";

export const dateRangeOptions: DateRangeOption[] = [
  "Today",
  "This Week",
  "This Month",
  "Custom Range",
];

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRangeOption;
  onChange: (value: DateRangeOption) => void;
}) {
  return (
    <div className="relative">
      <CalendarDays
        className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-neutral-400"
        aria-hidden="true"
      />
      <div className="[&_label]:pl-6">
        <SelectFilter
          label="Date Range Filter"
          value={value}
          options={dateRangeOptions}
          onChange={(option) => onChange(option as DateRangeOption)}
        />
      </div>
    </div>
  );
}
