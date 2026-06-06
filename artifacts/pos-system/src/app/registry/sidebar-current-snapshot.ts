import type { V3RuntimeRole } from "./module-types";

export type CurrentSidebarSnapshotItem = Readonly<{
  label: string;
  routePath: string;
  group: "Shared Dashboards" | "F&B Server" | "F&B Menu & Kitchen";
  roles: readonly V3RuntimeRole[];
  modes?: readonly string[];
  order: number;
}>;

export const currentSidebarSnapshot = [
  {
    label: "Sales Analytics",
    routePath: "/dashboard/analytics",
    group: "Shared Dashboards",
    roles: ["OWNER", "MANAGER"],
    order: 10,
  },
  {
    label: "Customers & Partners",
    routePath: "/dashboard/customers",
    group: "Shared Dashboards",
    roles: ["OWNER", "MANAGER"],
    order: 20,
  },
  {
    label: "Inventory",
    routePath: "/dashboard/inventory",
    group: "Shared Dashboards",
    roles: ["OWNER", "MANAGER"],
    order: 30,
  },
  {
    label: "Cashflow",
    routePath: "/dashboard/cashflow",
    group: "Shared Dashboards",
    roles: ["OWNER", "MANAGER"],
    order: 40,
  },
  {
    label: "Financial Reports",
    routePath: "/dashboard/financial-reports",
    group: "Shared Dashboards",
    roles: ["OWNER", "MANAGER"],
    order: 50,
  },
  {
    label: "Invoice Generator",
    routePath: "/dashboard/invoice-generator",
    group: "Shared Dashboards",
    roles: ["OWNER", "MANAGER"],
    order: 60,
  },
  {
    label: "Cashier Shift Reports",
    routePath: "/dashboard/cashier-shift-reports",
    group: "Shared Dashboards",
    roles: ["OWNER", "MANAGER"],
    order: 70,
  },
  {
    label: "Cashier",
    routePath: "/dashboard/fnb/server/checkout",
    group: "F&B Server",
    roles: ["OWNER", "MANAGER", "CASHIER"],
    modes: ["fnb"],
    order: 110,
  },
  {
    label: "Orders",
    routePath: "/dashboard/fnb/server/orders",
    group: "F&B Server",
    roles: ["OWNER", "MANAGER", "CASHIER"],
    modes: ["fnb"],
    order: 120,
  },
  {
    label: "Serving",
    routePath: "/dashboard/fnb/server/serving",
    group: "F&B Server",
    roles: ["OWNER", "MANAGER", "SERVER", "CASHIER"],
    modes: ["fnb"],
    order: 130,
  },
  {
    label: "Tables",
    routePath: "/dashboard/fnb/server/tables",
    group: "F&B Server",
    roles: ["OWNER", "MANAGER", "SERVER", "CASHIER"],
    modes: ["fnb"],
    order: 140,
  },
  {
    label: "Payments",
    routePath: "/dashboard/fnb/server/payments",
    group: "F&B Server",
    roles: ["OWNER", "MANAGER"],
    modes: ["fnb"],
    order: 150,
  },
  {
    label: "Menu",
    routePath: "/dashboard/fnb/menu",
    group: "F&B Menu & Kitchen",
    roles: ["OWNER", "MANAGER"],
    modes: ["fnb"],
    order: 160,
  },
  {
    label: "Recipes",
    routePath: "/dashboard/fnb/menu/recipes",
    group: "F&B Menu & Kitchen",
    roles: ["OWNER", "MANAGER"],
    modes: ["fnb"],
    order: 170,
  },
  {
    label: "Kitchen (KDS)",
    routePath: "/dashboard/fnb/kitchen",
    group: "F&B Menu & Kitchen",
    roles: ["OWNER", "MANAGER", "KITCHEN"],
    modes: ["fnb"],
    order: 180,
  },
] satisfies readonly CurrentSidebarSnapshotItem[];
