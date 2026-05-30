export const BUSINESS_MODE_STORAGE_KEY = "currentBusinessMode";

export type BusinessMode = "fnb" | "retail" | "service" | "warehouse";

export type BusinessModeOption = {
  id: BusinessMode;
  label: string;
  description: string;
};

export const businessModeOptions: BusinessModeOption[] = [
  {
    id: "fnb",
    label: "Restaurant / F&B",
    description: "Enable restaurant operations such as menu, kitchen, cashier, tables, and serving.",
  },
  {
    id: "retail",
    label: "Retail",
    description: "Shared dashboards only for now. Retail-exclusive modules will be added later.",
  },
  {
    id: "service",
    label: "Service",
    description: "Shared dashboards only for now. Service-exclusive modules will be added later.",
  },
  {
    id: "warehouse",
    label: "Warehouse",
    description: "Shared dashboards only for now. Warehouse-exclusive modules will be added later.",
  },
];

export function isBusinessMode(value: string | null): value is BusinessMode {
  return value === "fnb" || value === "retail" || value === "service" || value === "warehouse";
}

export function getStoredBusinessMode(): BusinessMode | null {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(BUSINESS_MODE_STORAGE_KEY);
  return isBusinessMode(value) ? value : null;
}

export function setStoredBusinessMode(mode: BusinessMode) {
  window.localStorage.setItem(BUSINESS_MODE_STORAGE_KEY, mode);
}

export function clearStoredBusinessMode() {
  window.localStorage.removeItem(BUSINESS_MODE_STORAGE_KEY);
}
