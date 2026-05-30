import { ROUTES } from "@/constants/routes";

export type FnbModuleId = "tables" | "menu" | "recipes" | "kitchen" | "serving";

export type FnbModule = {
  id: FnbModuleId;
  label: string;
  route: string;
  description: string;
};

export const fnbModules: FnbModule[] = [
  {
    id: "tables",
    label: "Table Management",
    route: ROUTES.TABLES,
    description: "Restaurant table status, seating, and table movement.",
  },
  {
    id: "menu",
    label: "Menu Management",
    route: ROUTES.MENU,
    description: "F&B menu items, categories, pricing, and availability.",
  },
  {
    id: "recipes",
    label: "Recipe Management",
    route: ROUTES.RECIPES,
    description: "Menu recipes, ingredient usage, and estimated COGS/HPP.",
  },
  {
    id: "kitchen",
    label: "Kitchen Display System",
    route: ROUTES.KDS,
    description: "Kitchen queue and production status for active orders.",
  },
  {
    id: "serving",
    label: "Serving Dashboard",
    route: ROUTES.SERVING,
    description: "Serving queue and ready-to-serve order handoff.",
  },
];
