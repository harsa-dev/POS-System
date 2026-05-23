// ---------------------------------------------------------------------------
// Table status constants — single source of truth for table status strings
// ---------------------------------------------------------------------------
export const TABLE_STATUS = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  RESERVED: "RESERVED",
  CLEANING: "CLEANING",
} as const;

export type TableStatusName = (typeof TABLE_STATUS)[keyof typeof TABLE_STATUS];

/** Tailwind badge classes for each table status */
export const TABLE_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  OCCUPIED: "bg-red-100 text-red-700",
  RESERVED: "bg-blue-100 text-blue-700",
  CLEANING: "bg-yellow-100 text-yellow-700",
};

export const TABLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  CLEANING: "Cleaning",
};
