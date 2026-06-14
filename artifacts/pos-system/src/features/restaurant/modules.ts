import { ROUTES } from "@/constants/routes";

export type RestaurantModuleId = "server" | "menu" | "recipes" | "kitchen";

export type RestaurantModule = {
  id: RestaurantModuleId;
  label: string;
  route: string;
  description: string;
};

export const restaurantModules: RestaurantModule[] = [
  {
    id: "server",
    label: "Server Operations",
    route: ROUTES.CHECKOUT,
    description: "Cashier, orders, payments, tables, and serving operations.",
  },
  {
    id: "menu",
    label: "Menu Management",
    route: ROUTES.MENU,
    description: "Restaurant menu items, categories, pricing, and availability.",
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
];
