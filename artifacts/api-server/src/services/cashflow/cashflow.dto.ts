import type { CashflowEntryDto, CashflowEntryRecord } from "./cashflow.types.js";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

export function toCashflowEntryDto(entry: CashflowEntryRecord): CashflowEntryDto {
  return {
    ...entry,
    occurredAt: entry.occurredAt.toISOString(),
    postedAt: toIsoString(entry.postedAt),
    voidedAt: toIsoString(entry.voidedAt),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export function toCashflowEntryDtos(entries: CashflowEntryRecord[]) {
  return entries.map(toCashflowEntryDto);
}
