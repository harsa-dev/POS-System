import { BookOpenCheck, ChefHat, PackageCheck, Pencil, Plus, Search } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
  DashboardShell,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, TableToolbar, type DataTableColumn } from "@/features/shared/table";

type RecipeRow = {
  menuItem: string;
  recipeCode: string;
  ingredients: number;
  estimatedHpp: number;
  status: "Active" | "Draft";
};

const recipeRows: RecipeRow[] = [
  {
    menuItem: "Chicken Rice Bowl",
    recipeCode: "RCP-001",
    ingredients: 8,
    estimatedHpp: 14_000,
    status: "Active",
  },
  {
    menuItem: "Iced Latte",
    recipeCode: "RCP-002",
    ingredients: 5,
    estimatedHpp: 8_500,
    status: "Active",
  },
  {
    menuItem: "Matcha Dessert",
    recipeCode: "RCP-003",
    ingredients: 7,
    estimatedHpp: 16_000,
    status: "Draft",
  },
];

const recipeColumns: DataTableColumn<RecipeRow>[] = [
  { key: "menuItem", header: "Menu Item", cell: (row) => <span className="font-semibold text-neutral-950">{row.menuItem}</span> },
  { key: "recipeCode", header: "Recipe Code", cell: (row) => row.recipeCode },
  { key: "ingredients", header: "Ingredients", cell: (row) => formatNumber(row.ingredients) },
  { key: "estimatedHpp", header: "Estimated HPP", cell: (row) => <span className="font-medium">{formatCurrency(row.estimatedHpp)}</span> },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <StatusPill tone={row.status === "Active" ? "green" : "amber"}>
        {row.status}
      </StatusPill>
    ),
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

export function RecipeManagementDashboard() {
  return (
    <DashboardShell
      title="Recipe Management"
      description="F&B-only recipe structure for connecting menu items, raw materials, COGS/HPP, and kitchen production rules."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="Recipes"
          value={formatNumber(recipeRows.length)}
          note="Menu recipes prepared for F&B mode"
          icon={BookOpenCheck}
          tone="blue"
        />
        <StatCard
          label="Linked Menu Items"
          value={formatNumber(2)}
          note="Recipes already active in menu"
          icon={ChefHat}
          tone="green"
        />
        <StatCard
          label="Average HPP"
          value={formatCurrency(12_833)}
          note="Estimated recipe cost"
          icon={PackageCheck}
          tone="amber"
        />
      </div>

      <DashboardPanel>
        <TableToolbar
          actions={
            <DashboardActions>
              <DashboardActionButton icon={Plus} variant="primary">Add Recipe</DashboardActionButton>
              <DashboardActionButton icon={Search}>Find Menu Item</DashboardActionButton>
            </DashboardActions>
          }
        />
      </DashboardPanel>

      <DashboardPanel title="Recipe Table">
        <DataTable
          columns={recipeColumns}
          data={recipeRows}
          getRowKey={(row) => row.recipeCode}
          minWidth={760}
        />
      </DashboardPanel>
    </DashboardShell>
  );
}
