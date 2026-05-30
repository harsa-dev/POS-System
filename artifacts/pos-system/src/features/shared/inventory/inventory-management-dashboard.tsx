"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  Package,
  Pencil,
  RefreshCw,
  SlidersHorizontal,
  TriangleAlert,
  Upload,
  Warehouse,
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
import { CategoryFilter, SearchFilter, SelectFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, TableToolbar, type DataTableColumn } from "@/features/shared/table";
import type {
  DashboardTone,
  InventoryItem,
  InventoryMode,
  InventoryStockStatus,
} from "@/features/shared/types";

const inventoryModes: InventoryMode[] = [
  "Finished Products",
  "Semi-Finished Products",
  "Raw Materials",
];

const categoryOptions = ["All Categories", "Food", "Beverage", "Ingredient", "Packaging"];
const sortOptions = ["Highest Stock Value", "Lowest Stock", "Product Name"];

const inventoryRows: InventoryItem[] = [
  {
    productName: "Chicken Rice Bowl",
    sku: "FP-RICE-001",
    mode: "Finished Products",
    category: "Food",
    stock: 84,
    costPrice: 14_000,
    sellingPrice: 32_000,
    threshold: 20,
  },
  {
    productName: "Iced Latte Base",
    sku: "SF-LATTE-004",
    mode: "Semi-Finished Products",
    category: "Beverage",
    stock: 16,
    costPrice: 8_500,
    sellingPrice: 0,
    threshold: 18,
  },
  {
    productName: "Chicken Fillet",
    sku: "RM-CHK-010",
    mode: "Raw Materials",
    category: "Ingredient",
    stock: 42,
    costPrice: 38_000,
    sellingPrice: 0,
    threshold: 15,
  },
  {
    productName: "Takeaway Bowl",
    sku: "RM-PKG-022",
    mode: "Raw Materials",
    category: "Packaging",
    stock: 0,
    costPrice: 1_200,
    sellingPrice: 0,
    threshold: 50,
  },
  {
    productName: "Lemon Tea",
    sku: "FP-TEA-008",
    mode: "Finished Products",
    category: "Beverage",
    stock: 128,
    costPrice: 4_000,
    sellingPrice: 15_000,
    threshold: 30,
  },
];

function getStockStatus(row: InventoryItem): {
  label: InventoryStockStatus;
  tone: DashboardTone;
} {
  if (row.stock === 0) return { label: "Out of Stock", tone: "rose" };
  if (row.stock <= row.threshold) return { label: "Low Stock", tone: "amber" };

  return { label: "In Stock", tone: "green" };
}

export function InventoryManagementDashboard() {
  const [mode, setMode] = useState<InventoryMode>("Finished Products");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(categoryOptions[0]);
  const [sort, setSort] = useState(sortOptions[0]);

  const filteredRows = useMemo(() => {
    const rows = inventoryRows.filter((row) => {
      const modeMatches = row.mode === mode;
      const categoryMatches =
        category === "All Categories" || row.category === category;
      const searchMatches = [row.productName, row.sku]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      return modeMatches && categoryMatches && searchMatches;
    });

    if (sort === "Lowest Stock") return [...rows].sort((a, b) => a.stock - b.stock);
    if (sort === "Product Name") {
      return [...rows].sort((a, b) => a.productName.localeCompare(b.productName));
    }

    return [...rows].sort(
      (a, b) => b.stock * b.costPrice - a.stock * a.costPrice,
    );
  }, [category, mode, search, sort]);

  const summary = useMemo(() => {
    const totalVariants = inventoryRows.length;
    const warehouseStock = inventoryRows.reduce((total, row) => total + row.stock, 0);
    const lowStock = inventoryRows.filter(
      (row) => row.stock > 0 && row.stock <= row.threshold,
    ).length;
    const outOfStock = inventoryRows.filter((row) => row.stock === 0).length;
    const inventoryValue = inventoryRows.reduce(
      (total, row) => total + row.stock * row.costPrice,
      0,
    );

    return { totalVariants, warehouseStock, lowStock, outOfStock, inventoryValue };
  }, []);

  const inventoryColumns: DataTableColumn<InventoryItem>[] = [
    { key: "productName", header: "Product Name", cell: (row) => <span className="font-semibold text-neutral-950">{row.productName}</span> },
    { key: "sku", header: "SKU", cell: (row) => row.sku },
    { key: "stock", header: "Stock", cell: (row) => formatNumber(row.stock) },
    { key: "costPrice", header: "Cost Price (HPP)", cell: (row) => formatCurrency(row.costPrice) },
    { key: "sellingPrice", header: "Selling Price", cell: (row) => row.sellingPrice > 0 ? formatCurrency(row.sellingPrice) : "-" },
    { key: "threshold", header: "Threshold", cell: (row) => formatNumber(row.threshold) },
    { key: "stockValue", header: "Stock Value", cell: (row) => <span className="font-medium">{formatCurrency(row.stock * row.costPrice)}</span> },
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
      cell: () => (
        <button type="button" className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-semibold hover:bg-neutral-50">
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
      ),
    },
  ];

  return (
    <DashboardShell
      title="Inventory Management"
      description="Manage finished products, semi-finished products, and raw materials with stock thresholds, values, and operational actions."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Product Variants" value={formatNumber(summary.totalVariants)} note="Across all inventory modes" icon={Package} tone="blue" />
        <StatCard label="Warehouse Stock" value={formatNumber(summary.warehouseStock)} note="Total stock units" icon={Warehouse} tone="green" />
        <StatCard label="Low Stock Products" value={formatNumber(summary.lowStock)} note="At or below threshold" icon={TriangleAlert} tone="amber" />
        <StatCard label="Out of Stock Products" value={formatNumber(summary.outOfStock)} note="Needs restock" icon={TriangleAlert} tone="rose" />
        <StatCard label="Inventory Value" value={formatCurrency(summary.inventoryValue)} note="Stock multiplied by HPP" icon={BarChart3} tone="slate" />
      </div>

      <DashboardPanel>
        <TableToolbar
          filters={
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <DashboardTabs
                value={mode}
                options={inventoryModes}
                onChange={(value) => setMode(value as InventoryMode)}
              />
              <DashboardFilters className="xl:min-w-[680px]">
                <SearchFilter
                  label="Search inventory"
                  value={search}
                  placeholder="Search product or SKU..."
                  onChange={setSearch}
                />
                <CategoryFilter
                  value={category}
                  options={categoryOptions}
                  onChange={setCategory}
                />
                <SelectFilter label="Sort" value={sort} options={sortOptions} onChange={setSort} />
              </DashboardFilters>
            </div>
          }
          actions={
            <DashboardActions>
              <DashboardActionButton icon={Upload} variant="primary">Import</DashboardActionButton>
              <DashboardActionButton
                icon={Download}
                onClick={() =>
                  exportCsv({
                    filename: "inventory",
                    rows: filteredRows,
                    columns: [
                      { key: "productName", header: "Product Name", value: (row) => row.productName },
                      { key: "sku", header: "SKU", value: (row) => row.sku },
                      { key: "stock", header: "Stock", value: (row) => row.stock },
                      { key: "costPrice", header: "Cost Price (HPP)", value: (row) => row.costPrice },
                      { key: "stockValue", header: "Stock Value", value: (row) => row.stock * row.costPrice },
                    ],
                  })
                }
              >
                Export
              </DashboardActionButton>
              <DashboardActionButton icon={BarChart3}>Stock Analysis</DashboardActionButton>
              <DashboardActionButton icon={RefreshCw}>Synchronization</DashboardActionButton>
              <DashboardActionButton icon={SlidersHorizontal}>Loss Report</DashboardActionButton>
            </DashboardActions>
          }
        />
      </DashboardPanel>

      <DashboardPanel title={`${mode} Table`}>
        <DataTable
          columns={inventoryColumns}
          data={filteredRows}
          getRowKey={(row) => row.sku}
          minWidth={1080}
        />
      </DashboardPanel>
    </DashboardShell>
  );
}
