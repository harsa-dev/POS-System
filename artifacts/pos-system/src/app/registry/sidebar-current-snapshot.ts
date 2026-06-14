import type { V3RuntimeRole } from "./module-types";
import { ROUTES } from "../../constants/routes";

export type CurrentSidebarSnapshotItem = Readonly<{
  label: string;
  routePath: string;
  group: "Shared Dashboards" | "Restaurant Server" | "Restaurant Menu & Kitchen";
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
    routePath: ROUTES.WORKSPACE_RESTAURANT_POS,
    group: "Restaurant Server",
    roles: ["OWNER", "MANAGER", "CASHIER"],
    modes: ["restaurant"],
    order: 110,
  },
  {
    label: "Orders",
    routePath: ROUTES.WORKSPACE_RESTAURANT_ORDERS,
    group: "Restaurant Server",
    roles: ["OWNER", "MANAGER", "CASHIER"],
    modes: ["restaurant"],
    order: 120,
  },
  {
    label: "Serving",
    routePath: ROUTES.WORKSPACE_RESTAURANT_SERVING,
    group: "Restaurant Server",
    roles: ["OWNER", "MANAGER", "SERVER", "CASHIER"],
    modes: ["restaurant"],
    order: 130,
  },
  {
    label: "Tables",
    routePath: ROUTES.WORKSPACE_RESTAURANT_TABLES,
    group: "Restaurant Server",
    roles: ["OWNER", "MANAGER", "SERVER", "CASHIER"],
    modes: ["restaurant"],
    order: 140,
  },
  {
    label: "Menu",
    routePath: ROUTES.WORKSPACE_RESTAURANT_MENU,
    group: "Restaurant Menu & Kitchen",
    roles: ["OWNER", "MANAGER"],
    modes: ["restaurant"],
    order: 160,
  },
  {
    label: "Recipes",
    routePath: ROUTES.WORKSPACE_RESTAURANT_RECIPES,
    group: "Restaurant Menu & Kitchen",
    roles: ["OWNER", "MANAGER"],
    modes: ["restaurant"],
    order: 170,
  },
  {
    label: "Kitchen (KDS)",
    routePath: ROUTES.WORKSPACE_RESTAURANT_KITCHEN,
    group: "Restaurant Menu & Kitchen",
    roles: ["OWNER", "MANAGER", "KITCHEN"],
    modes: ["restaurant"],
    order: 180,
  },
] satisfies readonly CurrentSidebarSnapshotItem[];
