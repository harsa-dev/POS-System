"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Clock3,
  Package,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

type InventoryType = "INGREDIENT" | "PACKAGING" | "EQUIPMENT";

type InventoryUnit =
  | "PCS"
  | "GRAM"
  | "KILOGRAM"
  | "LITER"
  | "ML"
  | "PACK"
  | "BOTTLE";

type MovementType = "IN" | "OUT" | "ADJUSTMENT";

type MovementReason =
  | "PURCHASE"
  | "RECIPE_USAGE"
  | "WASTE"
  | "EXPIRED"
  | "MANUAL_ADJUSTMENT"
  | "DAMAGED";

type InventoryItem = {
  id: string;
  name: string;
  sku?: string | null;
  type: InventoryType;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
};

type StockMovement = {
  id: string;
  inventoryItemId: string;
  type: MovementType;
  quantity: number;
  note?: string | null;
  createdAt: string;

  inventoryItem?: InventoryItem;
};

const inventoryTypes: InventoryType[] = [
  "INGREDIENT",
  "PACKAGING",
  "EQUIPMENT",
];

const units: InventoryUnit[] = [
  "PCS",
  "GRAM",
  "KILOGRAM",
  "LITER",
  "ML",
  "PACK",
  "BOTTLE",
];

function getMovementStyle(type: MovementType) {
  if (type === "IN") return "bg-green-100 text-green-700";
  if (type === "OUT") return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [movementType, setMovementType] = useState<MovementType>("IN");

  const [movementQuantity, setMovementQuantity] = useState("");

  const [movementNote, setMovementNote] = useState("");

  const [movementReason, setMovementReason] =
    useState<MovementReason>("PURCHASE");

  const [name, setName] = useState("");

  const [sku, setSku] = useState("");

  const [type, setType] = useState<InventoryType>("INGREDIENT");

  const [unit, setUnit] = useState<InventoryUnit>("PCS");

  const [currentStock, setCurrentStock] = useState("");

  const [minimumStock, setMinimumStock] = useState("");

  const [costPerUnit, setCostPerUnit] = useState("");

  async function fetchItems() {
    setIsFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/inventory-items", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else {
        setFetchError(data.message || "Failed to load inventory items");
      }
    } catch {
      setFetchError("Network error — could not load inventory items");
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      [item.name, item.sku, item.type, item.unit]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [items, search]);

  function resetForm() {
    setName("");
    setSku("");
    setType("INGREDIENT");
    setUnit("PCS");
    setCurrentStock("");
    setMinimumStock("");
    setCostPerUnit("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const res = await fetch("/api/inventory-items", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        sku,
        type,
        unit,
        reason: movementReason,
        currentStock: Number(currentStock || 0),
        minimumStock: Number(minimumStock || 0),
        costPerUnit: Number(costPerUnit || 0),
      }),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.message || "Failed to create inventory item");

      return;
    }

    resetForm();

    setIsModalOpen(false);

    fetchItems();
  }

  function openMovementModal(item: InventoryItem, type: MovementType) {
    setSelectedItem(item);

    setMovementType(type);

    setMovementQuantity("");

    setMovementNote("");

    setIsMovementModalOpen(true);
  }

  async function openHistoryModal(item: InventoryItem) {
    setSelectedItem(item);

    const res = await fetch("/api/inventory", { credentials: "include" });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.message || "Failed to fetch stock movements");
      return;
    }

    const itemMovements = data.data.filter(
      (movement: StockMovement) => movement.inventoryItemId === item.id,
    );

    setMovements(itemMovements);

    setIsHistoryModalOpen(true);
  }

  function closeHistoryModal() {
    setSelectedItem(null);
    setMovements([]);
    setIsHistoryModalOpen(false);
  }

  async function handleMovementSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedItem) return;

    const res = await fetch("/api/inventory", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inventoryItemId: selectedItem.id,
        type: movementType,
        quantity: Number(movementQuantity),
        note: movementNote,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.message || "Failed to create stock movement");

      return;
    }

    setIsMovementModalOpen(false);

    fetchItems();

    if (selectedItem) {
      const res = await fetch("/api/inventory", { credentials: "include" });
      const data = await res.json();

      if (data.success) {
        const itemMovements = data.data.filter(
          (movement: StockMovement) =>
            movement.inventoryItemId === selectedItem.id,
        );

        setMovements(itemMovements);
      }
    }
  }

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] min-h-0 flex-col gap-6 overflow-hidden">
        {/* Page header */}
        <section className="shrink-0 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Inventory Warehouse
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-neutral-500 sm:text-base">
            Manage ingredients, packaging, equipment, stock levels, and
            warehouse items.
          </p>
        </section>

        {/* Inventory list */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="shrink-0 border-b border-neutral-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Warehouse Items
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Items used by recipes and kitchen production.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex h-11 items-center gap-3 rounded-2xl border border-neutral-200 px-4 sm:w-80">
                  <Search className="h-4 w-4 shrink-0 text-neutral-400" />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search inventory..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {fetchError && (
            <div className="flex shrink-0 items-center gap-3 border-b border-red-100 bg-red-50 px-5 py-4">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="flex-1 text-sm text-red-700">{fetchError}</p>
              <button
                type="button"
                onClick={fetchItems}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-auto no-scrollbar">
            {/* ── Mobile card list ── */}
            <div className="block divide-y divide-neutral-100 lg:hidden">
              {isFetching ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-4 p-4">
                    <div className="flex gap-3">
                      <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-24" />
                        <div className="flex gap-2 pt-1">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-11 flex-1 rounded-2xl" />
                      <Skeleton className="h-11 flex-1 rounded-2xl" />
                      <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                      <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {filteredItems.map((item) => {
                    const isLowStock = item.currentStock <= item.minimumStock;

                    return (
                      <div key={item.id} className="space-y-4 p-4">
                        <div className="flex gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
                            <Package className="h-5 w-5 text-neutral-500" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{item.name}</p>

                            <p className="text-sm text-neutral-500">
                              {item.type} • {item.unit}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <StatusBadge
                                className={
                                  isLowStock
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }
                              >
                                Stock: {item.currentStock}
                              </StatusBadge>

                              <StatusBadge className="bg-yellow-100 text-yellow-700">
                                Min: {item.minimumStock}
                              </StatusBadge>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openMovementModal(item, "IN")}
                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                          >
                            <ArrowDown className="h-4 w-4" />
                            Add
                          </button>

                          <button
                            type="button"
                            onClick={() => openMovementModal(item, "OUT")}
                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            <ArrowUp className="h-4 w-4" />
                            Reduce
                          </button>

                          <button
                            type="button"
                            title="Adjustment"
                            onClick={() =>
                              openMovementModal(item, "ADJUSTMENT")
                            }
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 transition hover:bg-neutral-100"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            title="Movement history"
                            onClick={() => openHistoryModal(item)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 transition hover:bg-neutral-100"
                          >
                            <Clock3 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {filteredItems.length === 0 && !fetchError && (
                    <EmptyState
                      icon={Package}
                      title="No inventory items found"
                      description={
                        search
                          ? "Try a different search term."
                          : "Add your first item using the button above."
                      }
                    />
                  )}
                </>
              )}
            </div>

            {/* ── Desktop table ── */}
            <table className="hidden w-full min-w-[1050px] lg:table">
              <thead className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50">
                <tr className="text-left text-sm text-neutral-500">
                  <th className="px-6 py-4 font-medium">Item</th>

                  <th className="px-6 py-4 font-medium">Type</th>

                  <th className="px-6 py-4 font-medium">Stock</th>

                  <th className="px-6 py-4 font-medium">Minimum</th>

                  <th className="px-6 py-4 font-medium">Cost / Unit</th>

                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {isFetching ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <Skeleton className="h-10 w-10 rounded-xl" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    {filteredItems.map((item) => {
                      const isLowStock =
                        item.currentStock <= item.minimumStock;

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-neutral-100 transition hover:bg-neutral-50"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
                                <Package className="h-5 w-5 text-neutral-500" />
                              </div>

                              <div>
                                <p className="font-semibold text-neutral-900">
                                  {item.name}
                                </p>

                                <p className="text-sm text-neutral-500">
                                  {item.sku || "No SKU"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <StatusBadge className="bg-neutral-100 text-neutral-700">
                              {item.type}
                            </StatusBadge>
                          </td>

                          <td className="px-6 py-5">
                            <StatusBadge
                              className={
                                isLowStock
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }
                            >
                              {item.currentStock} {item.unit}
                            </StatusBadge>
                          </td>

                          <td className="px-6 py-5 text-neutral-600">
                            {item.minimumStock} {item.unit}
                          </td>

                          <td className="px-6 py-5 font-medium">
                            Rp {item.costPerUnit.toLocaleString("id-ID")}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                title="Add stock"
                                onClick={() => openMovementModal(item, "IN")}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-200 text-green-600 transition hover:bg-green-50"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                title="Reduce stock"
                                onClick={() => openMovementModal(item, "OUT")}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                title="Adjustment"
                                onClick={() =>
                                  openMovementModal(item, "ADJUSTMENT")
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-100"
                              >
                                <SlidersHorizontal className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                title="Movement history"
                                onClick={() => openHistoryModal(item)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-100"
                              >
                                <Clock3 className="h-4 w-4 text-neutral-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredItems.length === 0 && !fetchError && (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState
                            icon={Package}
                            title="No inventory items found"
                            description={
                              search
                                ? "Try a different search term."
                                : "Add your first item using the button above."
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── Add Item modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Add Inventory Item
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Create ingredient, packaging, or equipment item.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name, e.g. Chicken Fillet"
                className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-400"
              />

              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU (optional)"
                className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-400"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as InventoryType)}
                  className="h-11 rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
                >
                  {inventoryTypes.map((itemType) => (
                    <option key={itemType} value={itemType}>
                      {itemType}
                    </option>
                  ))}
                </select>

                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as InventoryUnit)}
                  className="h-11 rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
                >
                  {units.map((unitItem) => (
                    <option key={unitItem} value={unitItem}>
                      {unitItem}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  placeholder="Current stock"
                  className="h-11 rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-400"
                />

                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value)}
                  placeholder="Minimum"
                  className="h-11 rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-400"
                />

                <input
                  type="number"
                  min={0}
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder="Cost / unit"
                  className="h-11 rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 rounded-2xl border border-neutral-200 px-5 text-sm font-medium transition hover:bg-neutral-50"
                >
                  Cancel
                </button>

                <button className="h-11 rounded-2xl bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Stock Movement modal ── */}
      {isMovementModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Stock Movement
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  {selectedItem.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMovementModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="mt-6 space-y-4">
              <select
                value={movementType}
                onChange={(e) =>
                  setMovementType(e.target.value as MovementType)
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
              >
                <option value="IN">Stock In</option>

                <option value="OUT">Stock Out</option>

                <option value="ADJUSTMENT">Stock Adjustment</option>
              </select>

              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
                placeholder="Quantity"
                className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-400"
              />

              <textarea
                value={movementNote}
                onChange={(e) => setMovementNote(e.target.value)}
                placeholder="Optional note"
                className="min-h-[100px] w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
              />

              <select
                value={movementReason}
                onChange={(e) =>
                  setMovementReason(e.target.value as MovementReason)
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
              >
                <option value="PURCHASE">Purchase</option>

                <option value="RECIPE_USAGE">Recipe Usage</option>

                <option value="WASTE">Waste</option>

                <option value="EXPIRED">Expired</option>

                <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>

                <option value="DAMAGED">Damaged</option>
              </select>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="h-11 rounded-2xl border border-neutral-200 px-5 text-sm font-medium transition hover:bg-neutral-50"
                >
                  Cancel
                </button>

                <button className="h-11 rounded-2xl bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800">
                  Save Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Movement History modal ── */}
      {isHistoryModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl no-scrollbar">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Movement History
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  {selectedItem.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeHistoryModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        className={getMovementStyle(movement.type)}
                      >
                        {movement.type}
                      </StatusBadge>

                      <span className="text-sm font-semibold text-neutral-900">
                        {movement.quantity} {selectedItem.unit}
                      </span>
                    </div>

                    {movement.note && (
                      <p className="mt-2 text-sm text-neutral-500">
                        {movement.note}
                      </p>
                    )}
                  </div>

                  <p className="shrink-0 text-sm text-neutral-400">
                    {new Date(movement.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}

              {movements.length === 0 && (
                <EmptyState
                  icon={Clock3}
                  title="No movement history yet"
                  description="Stock changes will appear here after you add, reduce, adjust, or use this item in production."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
