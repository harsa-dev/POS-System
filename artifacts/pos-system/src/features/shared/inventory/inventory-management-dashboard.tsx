"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  BarChart3,
  Download,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  TriangleAlert,
  Upload,
  Warehouse,
  X,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardFilters,
  DashboardPanel,
  DashboardShell,
  DashboardTabs,
} from "@/features/shared/dashboard";
import { exportCsv } from "@/features/shared/export";
import { SearchFilter, SelectFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, TableToolbar, type DataTableColumn } from "@/features/shared/table";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  inventoryApi,
  type InventoryCapabilitiesDto,
  type InventoryItemDto,
  type InventoryType,
  type InventoryUnit,
  type StockMovementDto,
  type StockMovementReason,
  type StockMovementSource,
  type StockMovementType,
} from "@/lib/api/inventory-api";
import type { DashboardTone } from "@/features/shared/types";

const ALL_TYPES = "All Types";
const ALL_STATUS = "All Status";
const LOW_STOCK = "Low Stock";
const OUT_OF_STOCK = "Out of Stock";
const IN_STOCK = "In Stock";
const DEFAULT_TYPE: InventoryType = "INGREDIENT";
const DEFAULT_UNIT: InventoryUnit = "PCS";
const DEFAULT_REASON: StockMovementReason = "PURCHASE";

const statusOptions = [ALL_STATUS, LOW_STOCK, OUT_OF_STOCK, IN_STOCK];
const sortOptions = ["Highest Stock Value", "Lowest Stock", "Item Name", "Newest"];
const movementTypes: StockMovementType[] = ["IN", "OUT", "ADJUSTMENT"];

const fallbackTypes: InventoryType[] = ["INGREDIENT", "PACKAGING", "EQUIPMENT"];
const fallbackUnits: InventoryUnit[] = ["PCS", "GRAM", "KILOGRAM", "LITER", "ML", "PACK", "BOTTLE"];
const fallbackReasons: StockMovementReason[] = [
  "PURCHASE",
  "MANUAL_ADJUSTMENT",
  "STOCK_COUNT",
  "CORRECTION",
];
const lossReasons: StockMovementReason[] = ["WASTE", "EXPIRED", "DAMAGED"];

const csvColumns = [
  "name",
  "sku",
  "type",
  "unit",
  "openingStock",
  "minimumStock",
  "costPerUnit",
];

type InventoryDialogName = "create" | "movement" | "import" | "analysis" | "loss" | null;

type CreateInventoryFormState = {
  name: string;
  sku: string;
  type: InventoryType;
  unit: InventoryUnit;
  openingStock: string;
  minimumStock: string;
  costPerUnit: string;
};

type StockMovementFormState = {
  inventoryItemId: string;
  type: StockMovementType;
  quantity: string;
  reason: StockMovementReason;
  note: string;
  sourceType: StockMovementSource;
};

type ImportFormState = {
  csvText: string;
  defaultType: InventoryType;
  defaultUnit: InventoryUnit;
};

type ParsedImportRow = {
  rowNumber: number;
  name: string;
  sku: string;
  type: InventoryType;
  unit: InventoryUnit;
  openingStock: number;
  minimumStock: number;
  costPerUnit: number;
  errors: string[];
};

function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function getStockStatus(row: InventoryItemDto): {
  label: string;
  tone: DashboardTone;
} {
  if (row.stockStatus === "OUT_OF_STOCK") return { label: OUT_OF_STOCK, tone: "rose" };
  if (row.stockStatus === "LOW_STOCK") return { label: LOW_STOCK, tone: "amber" };

  return { label: IN_STOCK, tone: "green" };
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function parseRequiredNonNegativeNumber(value: string, field: string) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${field} must be a non-negative number.`);
  }

  return numberValue;
}

function toInputNumber(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}

function normalizeCsvHeader(value: string) {
  return value.trim().replace(/[\s_-]/g, "").toLowerCase();
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsvInventoryRows(params: {
  csvText: string;
  allowedTypes: InventoryType[];
  allowedUnits: InventoryUnit[];
  defaultType: InventoryType;
  defaultUnit: InventoryUnit;
}) {
  const { csvText, allowedTypes, allowedUnits, defaultType, defaultUnit } = params;
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]).map(normalizeCsvHeader);
  const getIndex = (...names: string[]) => names.map(normalizeCsvHeader).map((name) => header.indexOf(name)).find((index) => index >= 0) ?? -1;
  const nameIndex = getIndex("name", "item", "itemName", "productName");
  const skuIndex = getIndex("sku", "code");
  const typeIndex = getIndex("type", "category");
  const unitIndex = getIndex("unit");
  const stockIndex = getIndex("openingStock", "currentStock", "stock", "quantity");
  const minimumIndex = getIndex("minimumStock", "threshold", "minimum");
  const costIndex = getIndex("costPerUnit", "cost", "unitCost", "costPrice");

  return lines.slice(1).map((line, rowIndex): ParsedImportRow => {
    const cells = parseCsvLine(line);
    const errors: string[] = [];
    const name = nameIndex >= 0 ? cells[nameIndex]?.trim() ?? "" : "";
    const sku = skuIndex >= 0 ? cells[skuIndex]?.trim() ?? "" : "";
    const rawType = (typeIndex >= 0 ? cells[typeIndex]?.trim() : "") as InventoryType;
    const rawUnit = (unitIndex >= 0 ? cells[unitIndex]?.trim() : "") as InventoryUnit;
    const type = allowedTypes.includes(rawType) ? rawType : defaultType;
    const unit = allowedUnits.includes(rawUnit) ? rawUnit : defaultUnit;
    const openingStock = Number(stockIndex >= 0 ? cells[stockIndex] || 0 : 0);
    const minimumStock = Number(minimumIndex >= 0 ? cells[minimumIndex] || 0 : 0);
    const costPerUnit = Number(costIndex >= 0 ? cells[costIndex] || 0 : 0);

    if (!name) errors.push("name is required");
    if (!Number.isFinite(openingStock) || openingStock < 0) errors.push("openingStock must be non-negative");
    if (!Number.isFinite(minimumStock) || minimumStock < 0) errors.push("minimumStock must be non-negative");
    if (!Number.isFinite(costPerUnit) || costPerUnit < 0) errors.push("costPerUnit must be non-negative");

    return {
      rowNumber: rowIndex + 2,
      name,
      sku,
      type,
      unit,
      openingStock: Number.isFinite(openingStock) ? openingStock : 0,
      minimumStock: Number.isFinite(minimumStock) ? minimumStock : 0,
      costPerUnit: Number.isFinite(costPerUnit) ? costPerUnit : 0,
      errors,
    };
  });
}

function createDefaultItemForm(capabilities: InventoryCapabilitiesDto | null): CreateInventoryFormState {
  const policy = capabilities?.policy;
  return {
    name: "",
    sku: "",
    type: policy?.allowedTypes[0] ?? DEFAULT_TYPE,
    unit: policy?.allowedUnits[0] ?? DEFAULT_UNIT,
    openingStock: "0",
    minimumStock: "0",
    costPerUnit: "0",
  };
}

function createDefaultMovementForm(
  capabilities: InventoryCapabilitiesDto | null,
  item?: InventoryItemDto,
  type: StockMovementType = item ? "ADJUSTMENT" : "IN",
): StockMovementFormState {
  const reason = capabilities?.policy.allowedMovementReasons[0] ?? DEFAULT_REASON;

  return {
    inventoryItemId: item?.id ?? "",
    type,
    quantity: type === "ADJUSTMENT" && item ? toInputNumber(item.currentStock) : "",
    reason,
    note: "",
    sourceType: "MANUAL",
  };
}

function createDefaultImportForm(capabilities: InventoryCapabilitiesDto | null): ImportFormState {
  return {
    csvText: csvColumns.join(",") + "\n",
    defaultType: capabilities?.policy.allowedTypes[0] ?? DEFAULT_TYPE,
    defaultUnit: capabilities?.policy.allowedUnits[0] ?? DEFAULT_UNIT,
  };
}

function InventoryDialog({
  title,
  description,
  children,
  onClose,
  size = "lg",
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  size?: "lg" | "xl";
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4">
      <section className={`max-h-[92vh] w-full overflow-hidden rounded-2xl bg-white shadow-2xl ${size === "xl" ? "max-w-5xl" : "max-w-2xl"}`}>
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 p-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-neutral-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="max-h-[calc(92vh-96px)] overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{children}</span>;
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className="grid gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-400"
      />
    </label>
  );
}

function SelectInput<TValue extends string>({
  label,
  value,
  options,
  onChange,
  formatter = formatEnumLabel,
}: {
  label: string;
  value: TValue;
  options: TValue[];
  onChange: (value: TValue) => void;
  formatter?: (value: TValue) => string;
}) {
  return (
    <label className="grid gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
        className="h-10 rounded-lg border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-400"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatter(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-neutral-950">{value}</p>
      {note && <p className="mt-1 text-xs text-neutral-500">{note}</p>}
    </div>
  );
}

export function InventoryManagementDashboard() {
  const [capabilities, setCapabilities] = useState<InventoryCapabilitiesDto | null>(null);
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovementDto[]>([]);
  const [allMovements, setAllMovements] = useState<StockMovementDto[]>([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalStockValue: 0,
    ingredientItems: 0,
    packagingItems: 0,
    equipmentItems: 0,
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL_TYPES);
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [sort, setSort] = useState(sortOptions[0]);
  const [dialog, setDialog] = useState<InventoryDialogName>(null);
  const [itemForm, setItemForm] = useState<CreateInventoryFormState>(() => createDefaultItemForm(null));
  const [movementForm, setMovementForm] = useState<StockMovementFormState>(() => createDefaultMovementForm(null));
  const [importForm, setImportForm] = useState<ImportFormState>(() => createDefaultImportForm(null));
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setIsFetching(true);
    setErrorMessage(null);

    try {
      const [capabilityResponse, dashboardResponse, movementResponse] = await Promise.all([
        inventoryApi.getInventoryCapabilities(),
        inventoryApi.getInventoryDashboard(),
        inventoryApi.listStockMovements({ limit: 100 }),
      ]);

      const firstAllowedType = capabilityResponse.data.policy.allowedTypes[0] ?? DEFAULT_TYPE;
      const firstAllowedUnit = capabilityResponse.data.policy.allowedUnits[0] ?? DEFAULT_UNIT;
      const firstAllowedReason = capabilityResponse.data.policy.allowedMovementReasons[0] ?? DEFAULT_REASON;

      setCapabilities(capabilityResponse.data);
      setItems(dashboardResponse.data.items);
      setRecentMovements(dashboardResponse.data.recentMovements);
      setAllMovements(movementResponse.data);
      setSummary(dashboardResponse.data.summary);
      setLastSyncedAt(new Date().toISOString());
      setItemForm((current) => ({
        ...createDefaultItemForm(capabilityResponse.data),
        ...current,
        type: capabilityResponse.data.policy.allowedTypes.includes(current.type)
          ? current.type
          : firstAllowedType,
        unit: capabilityResponse.data.policy.allowedUnits.includes(current.unit)
          ? current.unit
          : firstAllowedUnit,
      }));
      setMovementForm((current) => ({
        ...current,
        reason: capabilityResponse.data.policy.allowedMovementReasons.includes(current.reason)
          ? current.reason
          : firstAllowedReason,
      }));
      setImportForm((current) => ({
        ...current,
        defaultType: capabilityResponse.data.policy.allowedTypes.includes(current.defaultType)
          ? current.defaultType
          : firstAllowedType,
        defaultUnit: capabilityResponse.data.policy.allowedUnits.includes(current.defaultUnit)
          ? current.defaultUnit
          : firstAllowedUnit,
      }));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to load inventory dashboard."));
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const typeOptions = useMemo(() => {
    const policyTypes = capabilities?.policy.allowedTypes ?? [];
    const itemTypes = Array.from(new Set(items.map((item) => item.type)));
    const options = policyTypes.length > 0 ? policyTypes : itemTypes;

    return [ALL_TYPES, ...options.map(formatEnumLabel)];
  }, [capabilities, items]);

  const typeValueByLabel = useMemo(() => {
    const map = new Map<string, InventoryType>();
    const allTypes = capabilities?.policy.allowedTypes ?? items.map((item) => item.type);

    allTypes.forEach((type) => {
      map.set(formatEnumLabel(type), type);
    });

    return map;
  }, [capabilities, items]);

  const filteredRows = useMemo(() => {
    const selectedType = typeValueByLabel.get(typeFilter);

    const rows = items.filter((row) => {
      const typeMatches = !selectedType || row.type === selectedType;
      const status = getStockStatus(row).label;
      const statusMatches = statusFilter === ALL_STATUS || status === statusFilter;
      const searchMatches = [row.name, row.sku ?? "", row.type, row.unit]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      return typeMatches && statusMatches && searchMatches;
    });

    if (sort === "Lowest Stock") return [...rows].sort((a, b) => a.currentStock - b.currentStock);
    if (sort === "Item Name") return [...rows].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "Newest") return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return [...rows].sort((a, b) => b.stockValue - a.stockValue);
  }, [items, search, sort, statusFilter, typeFilter, typeValueByLabel]);

  const totalStockUnits = useMemo(
    () => items.reduce((total, row) => total + row.currentStock, 0),
    [items],
  );

  const allowedTypes = capabilities?.policy.allowedTypes ?? fallbackTypes;
  const allowedUnits = capabilities?.policy.allowedUnits ?? fallbackUnits;
  const allowedReasons = capabilities?.policy.allowedMovementReasons ?? fallbackReasons;
  const policy = capabilities?.policy;
  const isNonRestaurantMode = policy ? policy.mode !== "restaurant" : false;

  const stockAnalysis = useMemo(() => {
    const totalMovements = allMovements.length;
    const outflowMovements = allMovements.filter((movement) => movement.type === "OUT");
    const inflowMovements = allMovements.filter((movement) => movement.type === "IN");
    const adjustmentMovements = allMovements.filter((movement) => movement.type === "ADJUSTMENT");
    const lowRiskItems = items.filter((item) => item.isLowStock || item.isOutOfStock);
    const totalCost = items.reduce((total, item) => total + item.costPerUnit, 0);
    const byType = allowedTypes.map((type) => {
      const rows = items.filter((item) => item.type === type);
      return {
        type,
        count: rows.length,
        quantity: rows.reduce((total, item) => total + item.currentStock, 0),
        value: rows.reduce((total, item) => total + item.stockValue, 0),
      };
    }).filter((bucket) => bucket.count > 0 || bucket.value > 0);

    return {
      totalMovements,
      outflowMovements,
      inflowMovements,
      adjustmentMovements,
      lowRiskItems,
      byType,
      averageCost: items.length > 0 ? totalCost / items.length : 0,
    };
  }, [allMovements, allowedTypes, items]);

  const lossRows = useMemo(() => {
    return allMovements.filter((movement) => {
      const reason = movement.reason;
      return movement.type === "OUT" && (
        reason === "WASTE" ||
        reason === "EXPIRED" ||
        reason === "DAMAGED" ||
        movement.sourceType === "WASTE"
      );
    });
  }, [allMovements]);

  const lossValue = useMemo(() => {
    return lossRows.reduce((total, movement) => {
      const unitCost = movement.unitCostSnapshot ?? movement.inventoryItem?.costPerUnit ?? 0;
      return total + movement.quantity * unitCost;
    }, 0);
  }, [lossRows]);

  const parsedImportRows = useMemo(() => {
    return parseCsvInventoryRows({
      csvText: importForm.csvText,
      allowedTypes,
      allowedUnits,
      defaultType: importForm.defaultType,
      defaultUnit: importForm.defaultUnit,
    });
  }, [allowedTypes, allowedUnits, importForm]);

  const validImportRows = parsedImportRows.filter((row) => row.errors.length === 0);
  const invalidImportRows = parsedImportRows.filter((row) => row.errors.length > 0);

  const openCreateDialog = () => {
    setFormError(null);
    setItemForm(createDefaultItemForm(capabilities));
    setDialog("create");
  };

  const openMovementDialog = (item?: InventoryItemDto, type: StockMovementType = "IN") => {
    setFormError(null);
    setMovementForm({
      ...createDefaultMovementForm(capabilities, item, type),
      type,
      quantity: type === "ADJUSTMENT" && item ? toInputNumber(item.currentStock) : "",
      sourceType: type === "OUT" ? "WASTE" : "MANUAL",
    });
    setDialog("movement");
  };

  const openImportDialog = () => {
    setFormError(null);
    setImportForm(createDefaultImportForm(capabilities));
    setDialog("import");
  };

  const openLossDialog = () => {
    setFormError(null);
    const firstLossReason = lossReasons.find((reason) => allowedReasons.includes(reason)) ?? allowedReasons[0] ?? "WASTE";
    setMovementForm({
      ...createDefaultMovementForm(capabilities),
      type: "OUT",
      reason: firstLossReason,
      sourceType: "WASTE",
      quantity: "",
    });
    setDialog("loss");
  };

  async function handleSynchronize() {
    setActionMessage("Synchronizing inventory data...");
    await loadInventory();
    setActionMessage(`Inventory synchronized at ${new Date().toLocaleString()}.`);
  }

  async function handleCreateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (!itemForm.name.trim()) throw new Error("Item name is required.");

      await inventoryApi.createInventoryItem({
        name: itemForm.name.trim(),
        sku: itemForm.sku.trim() || null,
        type: itemForm.type,
        unit: itemForm.unit,
        openingStock: parseOptionalNumber(itemForm.openingStock),
        minimumStock: parseOptionalNumber(itemForm.minimumStock),
        costPerUnit: parseOptionalNumber(itemForm.costPerUnit),
      });

      setDialog(null);
      setActionMessage("Inventory item created.");
      await loadInventory();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Failed to create inventory item."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitMovement(sourceType?: StockMovementSource) {
    const quantity = parseOptionalNumber(movementForm.quantity);

    if (!movementForm.inventoryItemId || quantity === undefined) {
      throw new Error("Inventory item and quantity are required.");
    }

    await inventoryApi.createStockMovement({
      inventoryItemId: movementForm.inventoryItemId,
      type: movementForm.type,
      quantity,
      reason: movementForm.reason,
      note: movementForm.note.trim() || null,
      sourceType: sourceType ?? movementForm.sourceType,
    });
  }

  async function handleCreateMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await submitMovement();
      setDialog(null);
      setActionMessage("Stock movement recorded.");
      await loadInventory();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Failed to create stock movement."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateLoss(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await submitMovement("WASTE");
      setDialog(null);
      setActionMessage("Loss movement recorded.");
      await loadInventory();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Failed to record loss movement."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImportInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (validImportRows.length === 0) throw new Error("No valid import rows found.");

      for (const row of validImportRows) {
        await inventoryApi.createInventoryItem({
          name: row.name,
          sku: row.sku || null,
          type: row.type,
          unit: row.unit,
          openingStock: row.openingStock,
          minimumStock: row.minimumStock,
          costPerUnit: row.costPerUnit,
        });
      }

      setDialog(null);
      setActionMessage(`${validImportRows.length} inventory item(s) imported.`);
      await loadInventory();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Failed to import inventory items."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const csvText = await file.text();
    setImportForm((current) => ({ ...current, csvText }));
    event.target.value = "";
  }

  const inventoryColumns: DataTableColumn<InventoryItemDto>[] = [
    {
      key: "name",
      header: "Item",
      cell: (row) => (
        <div>
          <span className="font-semibold text-neutral-950">{row.name}</span>
          <p className="mt-1 text-xs text-neutral-500">{formatEnumLabel(row.type)} • {row.unit}</p>
        </div>
      ),
    },
    { key: "sku", header: "SKU", cell: (row) => row.sku || "-" },
    { key: "stock", header: "Stock", cell: (row) => formatNumber(row.currentStock) },
    { key: "minimumStock", header: "Minimum", cell: (row) => formatNumber(row.minimumStock) },
    { key: "costPerUnit", header: "Cost / Unit", cell: (row) => formatCurrency(row.costPerUnit) },
    { key: "stockValue", header: "Stock Value", cell: (row) => <span className="font-medium">{formatCurrency(row.stockValue)}</span> },
    { key: "recipeCount", header: "Usage", cell: (row) => row.recipeCount > 0 ? `${row.recipeCount} recipe(s)` : `${row.movementCount} movement(s)` },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const status = getStockStatus(row);
        return <StatusPill tone={status.tone}>{status.label}</StatusPill>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openMovementDialog(row, "IN")}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-semibold hover:bg-neutral-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Restock
          </button>
          <button
            type="button"
            onClick={() => openMovementDialog(row, "ADJUSTMENT")}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-semibold hover:bg-neutral-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Adjust
          </button>
          <button
            type="button"
            onClick={() => openMovementDialog(row, "OUT")}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-semibold hover:bg-neutral-50"
          >
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Use/Loss
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      title="Inventory Management"
      description="API-backed shared inventory dashboard with import, analysis, synchronization, stock movement, and loss workflows."
    >
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => void loadInventory()}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {actionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{actionMessage}</span>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <DashboardPanel>
        <div className="grid gap-3 p-4 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Inventory Policy</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
              {policy?.label ?? "Loading inventory policy..."}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
              {policy?.description ?? "Fetching backend capabilities and dashboard data."}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Last sync: {lastSyncedAt ? formatDateTime(lastSyncedAt) : "Not synchronized yet"}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <StatusPill tone={policy?.recipeBacked ? "green" : "slate"}>
              {policy?.recipeBacked ? "Recipe-backed" : "Recipe optional"}
            </StatusPill>
            <StatusPill tone={policy?.supportsSkuStock ? "blue" : "slate"}>
              {policy?.supportsSkuStock ? "SKU-ready" : "SKU later"}
            </StatusPill>
            <StatusPill tone={isNonRestaurantMode ? "amber" : "green"}>
              {isNonRestaurantMode ? "Architecture Ready" : "Production Mode"}
            </StatusPill>
          </div>
        </div>
      </DashboardPanel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Inventory Items" value={isFetching ? "..." : formatNumber(summary.totalItems)} note="Backend source of truth" icon={Package} tone="blue" />
        <StatCard label="Stock Units" value={isFetching ? "..." : formatNumber(totalStockUnits)} note="Current quantity total" icon={Warehouse} tone="green" />
        <StatCard label="Low Stock" value={isFetching ? "..." : formatNumber(summary.lowStockItems)} note="Above zero but at threshold" icon={TriangleAlert} tone="amber" />
        <StatCard label="Out of Stock" value={isFetching ? "..." : formatNumber(summary.outOfStockItems)} note="Needs restock" icon={TriangleAlert} tone="rose" />
        <StatCard label="Inventory Value" value={isFetching ? "..." : formatCurrency(summary.totalStockValue)} note="Stock multiplied by cost" icon={BarChart3} tone="slate" />
      </div>

      <DashboardPanel>
        <TableToolbar
          filters={
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <DashboardTabs value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
              <DashboardFilters className="xl:min-w-[760px]">
                <SearchFilter
                  label="Search inventory"
                  value={search}
                  placeholder="Search item, SKU, type, or unit..."
                  onChange={setSearch}
                />
                <SelectFilter label="Type" value={typeFilter} options={typeOptions} onChange={setTypeFilter} />
                <SelectFilter label="Sort" value={sort} options={sortOptions} onChange={setSort} />
              </DashboardFilters>
            </div>
          }
          actions={
            <DashboardActions>
              <DashboardActionButton icon={Plus} variant="primary" onClick={openCreateDialog}>Add Item</DashboardActionButton>
              <DashboardActionButton icon={Activity} onClick={() => openMovementDialog()}>Stock Movement</DashboardActionButton>
              <DashboardActionButton icon={Upload} onClick={openImportDialog}>Import</DashboardActionButton>
              <DashboardActionButton
                icon={Download}
                onClick={() =>
                  exportCsv({
                    filename: "inventory",
                    rows: filteredRows,
                    columns: [
                      { key: "name", header: "Item", value: (row) => row.name },
                      { key: "sku", header: "SKU", value: (row) => row.sku ?? "" },
                      { key: "type", header: "Type", value: (row) => row.type },
                      { key: "unit", header: "Unit", value: (row) => row.unit },
                      { key: "stock", header: "Stock", value: (row) => row.currentStock },
                      { key: "minimumStock", header: "Minimum Stock", value: (row) => row.minimumStock },
                      { key: "costPerUnit", header: "Cost / Unit", value: (row) => row.costPerUnit },
                      { key: "stockValue", header: "Stock Value", value: (row) => row.stockValue },
                    ],
                  })
                }
              >
                Export
              </DashboardActionButton>
              <DashboardActionButton icon={BarChart3} onClick={() => setDialog("analysis")}>Stock Analysis</DashboardActionButton>
              <DashboardActionButton icon={RefreshCw} onClick={() => void handleSynchronize()}>Synchronization</DashboardActionButton>
              <DashboardActionButton icon={SlidersHorizontal} onClick={openLossDialog}>Loss Report</DashboardActionButton>
            </DashboardActions>
          }
        />
      </DashboardPanel>

      <DashboardPanel
        title="Inventory Table"
        description="Rows are loaded from backend inventory endpoints. Stock mutations refetch after backend confirmation."
      >
        <DataTable
          columns={inventoryColumns}
          data={isFetching ? [] : filteredRows}
          getRowKey={(row) => row.id}
          minWidth={1240}
          emptyMessage={isFetching ? "Loading inventory..." : "No inventory items match the current filters."}
        />
      </DashboardPanel>

      <DashboardPanel
        title="Recent Stock Movements"
        description="Latest backend-recorded stock changes with stock snapshots and source tracking."
      >
        <div className="divide-y divide-neutral-100">
          {recentMovements.map((movement) => (
            <div key={movement.id} className="grid gap-3 p-4 md:grid-cols-[1.5fr_1fr_1fr] md:items-center">
              <div>
                <p className="font-semibold text-neutral-950">{movement.inventoryItem?.name ?? movement.inventoryItemId}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {movement.reason ? formatEnumLabel(movement.reason) : formatEnumLabel(movement.type)} • {formatDateTime(movement.createdAt)}
                </p>
              </div>
              <div className="text-sm text-neutral-600">
                <span className="font-semibold text-neutral-950">{formatEnumLabel(movement.type)}</span> {formatNumber(movement.quantity)}
              </div>
              <div className="text-sm text-neutral-600">
                {movement.previousStock ?? "-"} → {movement.newStock ?? "-"}
              </div>
            </div>
          ))}
          {!isFetching && recentMovements.length === 0 && (
            <div className="p-8 text-center text-sm text-neutral-500">No stock movements recorded yet.</div>
          )}
          {isFetching && (
            <div className="p-8 text-center text-sm text-neutral-500">Loading recent movements...</div>
          )}
        </div>
      </DashboardPanel>

      {dialog === "create" && (
        <InventoryDialog
          title="Add Inventory Item"
          description="Create a backend inventory item. Opening stock is recorded through the stock movement workflow."
          onClose={() => setDialog(null)}
        >
          <form className="grid gap-4" onSubmit={handleCreateItem}>
            {formError && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{formError}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Item Name" value={itemForm.name} placeholder="Chicken fillet" onChange={(name) => setItemForm((current) => ({ ...current, name }))} />
              <TextInput label="SKU" value={itemForm.sku} placeholder="INV-001" onChange={(sku) => setItemForm((current) => ({ ...current, sku }))} />
              <SelectInput label="Type" value={itemForm.type} options={allowedTypes} onChange={(type) => setItemForm((current) => ({ ...current, type }))} />
              <SelectInput label="Unit" value={itemForm.unit} options={allowedUnits} onChange={(unit) => setItemForm((current) => ({ ...current, unit }))} />
              <TextInput type="number" label="Opening Stock" value={itemForm.openingStock} onChange={(openingStock) => setItemForm((current) => ({ ...current, openingStock }))} />
              <TextInput type="number" label="Minimum Stock" value={itemForm.minimumStock} onChange={(minimumStock) => setItemForm((current) => ({ ...current, minimumStock }))} />
              <TextInput type="number" label="Cost Per Unit" value={itemForm.costPerUnit} onChange={(costPerUnit) => setItemForm((current) => ({ ...current, costPerUnit }))} />
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
              <button type="button" onClick={() => setDialog(null)} className="h-10 rounded-lg border border-neutral-200 px-4 text-sm font-semibold text-neutral-700">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-50">
                <Save className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "Saving..." : "Save Item"}
              </button>
            </div>
          </form>
        </InventoryDialog>
      )}

      {dialog === "movement" && (
        <InventoryDialog
          title="Create Stock Movement"
          description="Record restock, usage, or stock count adjustments through the backend movement workflow."
          onClose={() => setDialog(null)}
        >
          <form className="grid gap-4" onSubmit={handleCreateMovement}>
            {formError && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{formError}</div>}
            {items.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Create an inventory item first, then record stock movement against that item.
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectInput
                    label="Inventory Item"
                    value={movementForm.inventoryItemId}
                    options={items.map((item) => item.id)}
                    formatter={(id) => items.find((item) => item.id === id)?.name ?? "Select item"}
                    onChange={(inventoryItemId) => setMovementForm((current) => ({ ...current, inventoryItemId }))}
                  />
                  <SelectInput label="Movement Type" value={movementForm.type} options={movementTypes} onChange={(type) => setMovementForm((current) => ({ ...current, type }))} />
                  <TextInput type="number" label="Quantity" value={movementForm.quantity} onChange={(quantity) => setMovementForm((current) => ({ ...current, quantity }))} />
                  <SelectInput label="Reason" value={movementForm.reason} options={allowedReasons} onChange={(reason) => setMovementForm((current) => ({ ...current, reason }))} />
                </div>
                <label className="grid gap-1.5">
                  <FieldLabel>Note</FieldLabel>
                  <textarea
                    value={movementForm.note}
                    onChange={(event) => setMovementForm((current) => ({ ...current, note: event.target.value }))}
                    placeholder="Optional operational note..."
                    className="min-h-24 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
                  />
                </label>
              </>
            )}
            <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
              <button type="button" onClick={() => setDialog(null)} className="h-10 rounded-lg border border-neutral-200 px-4 text-sm font-semibold text-neutral-700">Cancel</button>
              <button type="submit" disabled={isSubmitting || items.length === 0} className="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-50">
                <Save className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "Saving..." : "Save Movement"}
              </button>
            </div>
          </form>
        </InventoryDialog>
      )}

      {dialog === "import" && (
        <InventoryDialog
          title="Import Inventory CSV"
          description="Import creates real backend inventory items row-by-row through the existing create item endpoint."
          onClose={() => setDialog(null)}
          size="xl"
        >
          <form className="grid gap-4" onSubmit={handleImportInventory}>
            {formError && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{formError}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <SelectInput label="Default Type" value={importForm.defaultType} options={allowedTypes} onChange={(defaultType) => setImportForm((current) => ({ ...current, defaultType }))} />
              <SelectInput label="Default Unit" value={importForm.defaultUnit} options={allowedUnits} onChange={(defaultUnit) => setImportForm((current) => ({ ...current, defaultUnit }))} />
            </div>
            <label className="grid gap-1.5">
              <FieldLabel>CSV File</FieldLabel>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => void handleImportFile(event)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1.5">
              <FieldLabel>CSV Content</FieldLabel>
              <textarea
                value={importForm.csvText}
                onChange={(event) => setImportForm((current) => ({ ...current, csvText: event.target.value }))}
                className="min-h-44 rounded-lg border border-neutral-200 px-3 py-2 font-mono text-xs outline-none transition focus:border-neutral-400"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <InfoCard label="Rows" value={formatNumber(parsedImportRows.length)} />
              <InfoCard label="Valid" value={formatNumber(validImportRows.length)} />
              <InfoCard label="Invalid" value={formatNumber(invalidImportRows.length)} />
            </div>
            {invalidImportRows.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <p className="font-semibold">Rows with issues</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {invalidImportRows.slice(0, 5).map((row) => (
                    <li key={row.rowNumber}>Row {row.rowNumber}: {row.errors.join(", ")}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
              <button type="button" onClick={() => setDialog(null)} className="h-10 rounded-lg border border-neutral-200 px-4 text-sm font-semibold text-neutral-700">Cancel</button>
              <button type="submit" disabled={isSubmitting || validImportRows.length === 0} className="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-50">
                <Upload className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "Importing..." : `Import ${validImportRows.length} Row(s)`}
              </button>
            </div>
          </form>
        </InventoryDialog>
      )}

      {dialog === "analysis" && (
        <InventoryDialog
          title="Stock Analysis"
          description="Computed from backend inventory items and the latest movement history loaded from the API."
          onClose={() => setDialog(null)}
          size="xl"
        >
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <InfoCard label="Movements" value={formatNumber(stockAnalysis.totalMovements)} />
              <InfoCard label="Inbound" value={formatNumber(stockAnalysis.inflowMovements.length)} />
              <InfoCard label="Outbound" value={formatNumber(stockAnalysis.outflowMovements.length)} />
              <InfoCard label="Average Cost" value={formatCurrency(stockAnalysis.averageCost)} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-neutral-200">
                <div className="border-b border-neutral-200 p-4">
                  <h3 className="font-bold text-neutral-950">Value by Type</h3>
                </div>
                <div className="divide-y divide-neutral-100">
                  {stockAnalysis.byType.map((bucket) => (
                    <div key={bucket.type} className="grid grid-cols-[1fr_auto] gap-3 p-4 text-sm">
                      <div>
                        <p className="font-semibold text-neutral-950">{formatEnumLabel(bucket.type)}</p>
                        <p className="text-xs text-neutral-500">{formatNumber(bucket.count)} item(s), {formatNumber(bucket.quantity)} unit(s)</p>
                      </div>
                      <span className="font-semibold text-neutral-950">{formatCurrency(bucket.value)}</span>
                    </div>
                  ))}
                  {stockAnalysis.byType.length === 0 && <p className="p-4 text-sm text-neutral-500">No inventory type value yet.</p>}
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200">
                <div className="border-b border-neutral-200 p-4">
                  <h3 className="font-bold text-neutral-950">Risk Items</h3>
                </div>
                <div className="divide-y divide-neutral-100">
                  {stockAnalysis.lowRiskItems.slice(0, 8).map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 p-4 text-sm">
                      <div>
                        <p className="font-semibold text-neutral-950">{item.name}</p>
                        <p className="text-xs text-neutral-500">Stock {formatNumber(item.currentStock)} / Min {formatNumber(item.minimumStock)}</p>
                      </div>
                      <StatusPill tone={getStockStatus(item).tone}>{getStockStatus(item).label}</StatusPill>
                    </div>
                  ))}
                  {stockAnalysis.lowRiskItems.length === 0 && <p className="p-4 text-sm text-neutral-500">No low-stock risk detected.</p>}
                </div>
              </div>
            </div>
          </div>
        </InventoryDialog>
      )}

      {dialog === "loss" && (
        <InventoryDialog
          title="Loss Report"
          description="Review recorded losses and create new loss movements through the backend stock movement workflow."
          onClose={() => setDialog(null)}
          size="xl"
        >
          <div className="grid gap-4">
            <form className="grid gap-4 rounded-xl border border-neutral-200 p-4" onSubmit={handleCreateLoss}>
              {formError && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{formError}</div>}
              {items.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  Create inventory items before recording loss movements.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-4">
                  <SelectInput
                    label="Inventory Item"
                    value={movementForm.inventoryItemId}
                    options={items.map((item) => item.id)}
                    formatter={(id) => items.find((item) => item.id === id)?.name ?? "Select item"}
                    onChange={(inventoryItemId) => setMovementForm((current) => ({ ...current, inventoryItemId }))}
                  />
                  <TextInput type="number" label="Quantity Lost" value={movementForm.quantity} onChange={(quantity) => setMovementForm((current) => ({ ...current, quantity }))} />
                  <SelectInput label="Reason" value={movementForm.reason} options={lossReasons.filter((reason) => allowedReasons.includes(reason))} onChange={(reason) => setMovementForm((current) => ({ ...current, reason }))} />
                  <TextInput label="Note" value={movementForm.note} placeholder="Broken, expired, wasted..." onChange={(note) => setMovementForm((current) => ({ ...current, note }))} />
                </div>
              )}
              <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting || items.length === 0} className="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-50">
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {isSubmitting ? "Recording..." : "Record Loss"}
                </button>
              </div>
            </form>
            <div className="grid gap-3 md:grid-cols-3">
              <InfoCard label="Loss Entries" value={formatNumber(lossRows.length)} />
              <InfoCard label="Estimated Loss Value" value={formatCurrency(lossValue)} />
              <button
                type="button"
                onClick={() =>
                  exportCsv({
                    filename: "inventory-loss-report",
                    rows: lossRows,
                    columns: [
                      { key: "item", header: "Item", value: (row) => row.inventoryItem?.name ?? row.inventoryItemId },
                      { key: "reason", header: "Reason", value: (row) => row.reason ?? "" },
                      { key: "quantity", header: "Quantity", value: (row) => row.quantity },
                      { key: "unitCost", header: "Unit Cost", value: (row) => row.unitCostSnapshot ?? row.inventoryItem?.costPerUnit ?? 0 },
                      { key: "createdAt", header: "Created At", value: (row) => row.createdAt },
                    ],
                  })
                }
                className="rounded-xl border border-neutral-200 bg-white p-4 text-left text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Export Loss Report
              </button>
            </div>
            <div className="rounded-xl border border-neutral-200">
              <div className="divide-y divide-neutral-100">
                {lossRows.map((movement) => (
                  <div key={movement.id} className="grid gap-2 p-4 text-sm md:grid-cols-[1.4fr_1fr_1fr] md:items-center">
                    <div>
                      <p className="font-semibold text-neutral-950">{movement.inventoryItem?.name ?? movement.inventoryItemId}</p>
                      <p className="text-xs text-neutral-500">{formatDateTime(movement.createdAt)}</p>
                    </div>
                    <span>{movement.reason ? formatEnumLabel(movement.reason) : "Loss"}</span>
                    <span className="font-semibold text-neutral-950">{formatNumber(movement.quantity)}</span>
                  </div>
                ))}
                {lossRows.length === 0 && <p className="p-4 text-sm text-neutral-500">No loss movements recorded in the loaded movement history.</p>}
              </div>
            </div>
          </div>
        </InventoryDialog>
      )}
    </DashboardShell>
  );
}
