"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  type StockMovementReason,
  type StockMovementType,
} from "@/lib/api/inventory-api";
import type { DashboardTone } from "@/features/shared/types";

const ALL_TYPES = "All Types";
const ALL_STATUS = "All Status";
const LOW_STOCK = "Low Stock";
const OUT_OF_STOCK = "Out of Stock";
const IN_STOCK = "In Stock";

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
};

function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
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

function toInputNumber(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}

function createDefaultItemForm(capabilities: InventoryCapabilitiesDto | null): CreateInventoryFormState {
  const policy = capabilities?.policy;
  return {
    name: "",
    sku: "",
    type: policy?.allowedTypes[0] ?? fallbackTypes[0],
    unit: policy?.allowedUnits[0] ?? fallbackUnits[0],
    openingStock: "0",
    minimumStock: "0",
    costPerUnit: "0",
  };
}

function createDefaultMovementForm(
  capabilities: InventoryCapabilitiesDto | null,
  item?: InventoryItemDto,
): StockMovementFormState {
  const reason = capabilities?.policy.allowedMovementReasons[0] ?? fallbackReasons[0];

  return {
    inventoryItemId: item?.id ?? "",
    type: item ? "ADJUSTMENT" : "IN",
    quantity: item ? toInputNumber(item.currentStock) : "",
    reason,
    note: "",
  };
}

function InventoryDialog({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4">
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
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
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
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

export function InventoryManagementDashboard() {
  const [capabilities, setCapabilities] = useState<InventoryCapabilitiesDto | null>(null);
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [recentMovements, setRecentMovements] = useState<Awaited<ReturnType<typeof inventoryApi.getInventoryDashboard>>["data"]["recentMovements"]>([]);
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
  const [dialog, setDialog] = useState<"create" | "movement" | null>(null);
  const [itemForm, setItemForm] = useState<CreateInventoryFormState>(() => createDefaultItemForm(null));
  const [movementForm, setMovementForm] = useState<StockMovementFormState>(() => createDefaultMovementForm(null));
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setIsFetching(true);
    setErrorMessage(null);

    try {
      const [capabilityResponse, dashboardResponse] = await Promise.all([
        inventoryApi.getInventoryCapabilities(),
        inventoryApi.getInventoryDashboard(),
      ]);

      setCapabilities(capabilityResponse.data);
      setItems(dashboardResponse.data.items);
      setRecentMovements(dashboardResponse.data.recentMovements);
      setSummary(dashboardResponse.data.summary);
      setItemForm((current) => ({
        ...createDefaultItemForm(capabilityResponse.data),
        ...current,
        type: capabilityResponse.data.policy.allowedTypes.includes(current.type)
          ? current.type
          : capabilityResponse.data.policy.allowedTypes[0],
        unit: capabilityResponse.data.policy.allowedUnits.includes(current.unit)
          ? current.unit
          : capabilityResponse.data.policy.allowedUnits[0],
      }));
      setMovementForm((current) => ({
        ...current,
        reason: capabilityResponse.data.policy.allowedMovementReasons.includes(current.reason)
          ? current.reason
          : capabilityResponse.data.policy.allowedMovementReasons[0],
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

  const openCreateDialog = () => {
    setFormError(null);
    setItemForm(createDefaultItemForm(capabilities));
    setDialog("create");
  };

  const openMovementDialog = (item?: InventoryItemDto, type: StockMovementType = "IN") => {
    setFormError(null);
    setMovementForm({
      ...createDefaultMovementForm(capabilities, item),
      type,
      quantity: type === "ADJUSTMENT" && item ? toInputNumber(item.currentStock) : "",
    });
    setDialog("movement");
  };

  async function handleCreateItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
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
      await loadInventory();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Failed to create inventory item."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateMovement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
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
        sourceType: "MANUAL",
      });

      setDialog(null);
      await loadInventory();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Failed to create stock movement."));
    } finally {
      setIsSubmitting(false);
    }
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
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      title="Inventory Management"
      description="API-backed shared inventory dashboard for stock visibility, item creation, and movement workflows across supported business modes."
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
              <DashboardActionButton icon={Plus} variant="primary" onClick={openCreateDialog} disabled={isFetching}>Add Item</DashboardActionButton>
              <DashboardActionButton icon={Activity} onClick={() => openMovementDialog()} disabled={items.length === 0 || isFetching}>Stock Movement</DashboardActionButton>
              <DashboardActionButton
                icon={Download}
                disabled={filteredRows.length === 0}
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
              <DashboardActionButton icon={Upload} disabled title="Backend import endpoint is not implemented yet.">Import</DashboardActionButton>
              <DashboardActionButton icon={BarChart3} disabled title="Advanced stock analysis is planned.">Stock Analysis</DashboardActionButton>
              <DashboardActionButton icon={RefreshCw} disabled title="Sync workflow is planned.">Synchronization</DashboardActionButton>
              <DashboardActionButton icon={SlidersHorizontal} disabled title="Loss report workflow is planned.">Loss Report</DashboardActionButton>
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
          minWidth={1180}
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
                  {movement.reason ? formatEnumLabel(movement.reason) : formatEnumLabel(movement.type)} • {new Date(movement.createdAt).toLocaleString()}
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
            <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
              <button type="button" onClick={() => setDialog(null)} className="h-10 rounded-lg border border-neutral-200 px-4 text-sm font-semibold text-neutral-700">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-50">
                <Save className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "Saving..." : "Save Movement"}
              </button>
            </div>
          </form>
        </InventoryDialog>
      )}
    </DashboardShell>
  );
}
