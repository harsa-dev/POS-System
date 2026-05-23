"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  ArrowDown,
  ArrowUp,
  Clock3,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

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
  if (type === "IN") {
    return "bg-green-100 text-green-700";
  }

  if (type === "OUT") {
    return "bg-red-100 text-red-700";
  }

  return "bg-blue-100 text-blue-700";
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);

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
    const res = await fetch("/api/inventory-items", { credentials: "include" });

    const data = await res.json();

    if (data.success) {
      setItems(data.data);
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
      alert(data.message || "Failed to create inventory item");

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
      alert(data.message || "Failed to fetch stock movements");
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
      alert(data.message || "Failed to create stock movement");

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
        <section className="shrink-0 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Inventory Warehouse
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-neutral-500 sm:text-base">
            Manage ingredients, packaging, equipment, stock levels, and
            warehouse items.
          </p>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
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
                <div className="flex h-12 items-center gap-3 rounded-2xl border border-neutral-200 px-4 sm:w-80">
                  <Search className="h-4 w-4 text-neutral-400" />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search inventory..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto no-scrollbar">
            <div className="block divide-y divide-neutral-100 lg:hidden">
              {filteredItems.map((item) => {
                const isLowStock = item.currentStock <= item.minimumStock;

                return (
                  <div key={item.id} className="space-y-4 p-4">
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
                        <Package className="h-5 w-5 text-neutral-500" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{item.name}</p>

                        <p className="text-sm text-neutral-500">
                          {item.type} • {item.unit}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span
                            className={`rounded-full px-3 py-1 font-semibold ${
                              isLowStock
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            Stock: {item.currentStock}
                          </span>

                          <span className="rounded-full bg-yellow-100 px-3 py-1 font-semibold text-yellow-700">
                            Min: {item.minimumStock}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openMovementModal(item, "IN")}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 text-sm font-semibold text-green-700"
                      >
                        <ArrowDown className="h-4 w-4" />
                        Add
                      </button>

                      <button
                        type="button"
                        onClick={() => openMovementModal(item, "OUT")}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700"
                      >
                        <ArrowUp className="h-4 w-4" />
                        Reduce
                      </button>

                      <button
                        type="button"
                        onClick={() => openMovementModal(item, "ADJUSTMENT")}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openHistoryModal(item)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200"
                      >
                        <Clock3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <table className="hidden w-full min-w-[1050px] lg:table">
              <thead className="sticky top-0 z-10 border-b bg-neutral-50">
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
                {filteredItems.map((item) => {
                  const isLowStock = item.currentStock <= item.minimumStock;

                  return (
                    <tr key={item.id} className="border-b border-neutral-100">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
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
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">
                          {item.type}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isLowStock
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
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
                            onClick={() => openMovementModal(item, "IN")}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-200 text-green-600 transition hover:bg-green-50"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openMovementModal(item, "OUT")}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openMovementModal(item, "ADJUSTMENT")
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-100"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
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

                {filteredItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-neutral-500"
                    >
                      No inventory items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl">
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
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-neutral-100"
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
                className="h-12 w-full rounded-2xl border px-4 outline-none"
              />

              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU optional"
                className="h-12 w-full rounded-2xl border px-4 outline-none"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as InventoryType)}
                  className="h-12 rounded-2xl border px-4 outline-none"
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
                  className="h-12 rounded-2xl border px-4 outline-none"
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
                  className="h-12 rounded-2xl border px-4 outline-none"
                />

                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value)}
                  placeholder="Minimum"
                  className="h-12 rounded-2xl border px-4 outline-none"
                />

                <input
                  type="number"
                  min={0}
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder="Cost / unit"
                  className="h-12 rounded-2xl border px-4 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-12 rounded-2xl border px-5 font-medium"
                >
                  Cancel
                </button>

                <button className="h-12 rounded-2xl bg-neutral-950 px-6 font-semibold text-white">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMovementModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
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
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-neutral-100"
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
                className="h-12 w-full rounded-2xl border px-4 outline-none"
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
                className="h-12 w-full rounded-2xl border px-4 outline-none"
              />

              <textarea
                value={movementNote}
                onChange={(e) => setMovementNote(e.target.value)}
                placeholder="Optional note"
                className="min-h-[120px] w-full rounded-2xl border px-4 py-4 outline-none"
              />

              <select
                value={movementReason}
                onChange={(e) =>
                  setMovementReason(e.target.value as MovementReason)
                }
                className="h-12 w-full rounded-2xl border px-4 outline-none"
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
                  className="h-12 rounded-2xl border px-5 font-medium"
                >
                  Cancel
                </button>

                <button className="h-12 rounded-2xl bg-neutral-950 px-6 font-semibold text-white">
                  Save Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isHistoryModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl no-scrollbar">
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-neutral-100"
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
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getMovementStyle(
                          movement.type,
                        )}`}
                      >
                        {movement.type}
                      </span>

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

                  <p className="text-sm text-neutral-400">
                    {new Date(movement.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}

              {movements.length === 0 && (
                <div className="rounded-3xl border border-dashed border-neutral-200 p-10 text-center">
                  <p className="font-semibold text-neutral-800">
                    No movement history yet
                  </p>

                  <p className="mt-1 text-sm text-neutral-500">
                    Stock changes will appear here after you add, reduce,
                    adjust, or use this item in production.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
