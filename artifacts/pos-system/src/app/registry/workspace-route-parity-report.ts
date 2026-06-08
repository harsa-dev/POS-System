import { ROUTES } from "../../constants/routes";
import type { V3BusinessMode, V3ModuleId } from "./module-types";
import { getWorkspaceRoutesForMode } from "./workspace-registry";

type RestaurantWorkspaceModuleId =
  | "pos"
  | "kitchen"
  | "serving"
  | "tables"
  | "menu"
  | "recipes"
  | "orders";

type WorkspaceRouteExpectation = Readonly<{
  moduleId: RestaurantWorkspaceModuleId;
  routeConstant: keyof typeof ROUTES;
  routePath: string;
}>;

type WorkspacePlaceholderRoute = Readonly<{
  moduleId: RestaurantWorkspaceModuleId;
  routePath: string;
  placeholderName: string;
}>;

type WorkspaceRegistryRoute = ReturnType<typeof getWorkspaceRoutesForMode>[number];

type WorkspaceRouteMismatch = Readonly<{
  moduleId: V3ModuleId;
  expectedRoute: string;
  actualRoute: string;
}>;

type MissingWorkspaceRoute = Readonly<{
  moduleId: V3ModuleId;
  expectedRoute: string;
}>;

type ExtraWorkspaceRoute = Readonly<{
  moduleId: V3ModuleId;
  routePath: string;
}>;

export type WorkspaceRouteParityReport = Readonly<{
  mode: V3BusinessMode;
  registryRouteCount: number;
  expectedRouteCount: number;
  placeholderRouteCount: number;
  matchedRouteCount: number;
  missingRegistryRoutes: readonly MissingWorkspaceRoute[];
  extraRegistryRoutes: readonly ExtraWorkspaceRoute[];
  registryRouteMismatches: readonly WorkspaceRouteMismatch[];
  missingPlaceholderRoutes: readonly MissingWorkspaceRoute[];
  extraPlaceholderRoutes: readonly ExtraWorkspaceRoute[];
  placeholderRouteMismatches: readonly WorkspaceRouteMismatch[];
  passes: boolean;
}>;

export const restaurantWorkspaceRouteExpectations =
  [
    {
      moduleId: "pos",
      routeConstant: "WORKSPACE_RESTAURANT_POS",
      routePath: ROUTES.WORKSPACE_RESTAURANT_POS,
    },
    {
      moduleId: "kitchen",
      routeConstant: "WORKSPACE_RESTAURANT_KITCHEN",
      routePath: ROUTES.WORKSPACE_RESTAURANT_KITCHEN,
    },
    {
      moduleId: "serving",
      routeConstant: "WORKSPACE_RESTAURANT_SERVING",
      routePath: ROUTES.WORKSPACE_RESTAURANT_SERVING,
    },
    {
      moduleId: "tables",
      routeConstant: "WORKSPACE_RESTAURANT_TABLES",
      routePath: ROUTES.WORKSPACE_RESTAURANT_TABLES,
    },
    {
      moduleId: "menu",
      routeConstant: "WORKSPACE_RESTAURANT_MENU",
      routePath: ROUTES.WORKSPACE_RESTAURANT_MENU,
    },
    {
      moduleId: "recipes",
      routeConstant: "WORKSPACE_RESTAURANT_RECIPES",
      routePath: ROUTES.WORKSPACE_RESTAURANT_RECIPES,
    },
    {
      moduleId: "orders",
      routeConstant: "WORKSPACE_RESTAURANT_ORDERS",
      routePath: ROUTES.WORKSPACE_RESTAURANT_ORDERS,
    },
  ] as const satisfies readonly WorkspaceRouteExpectation[];

export const restaurantWorkspacePlaceholderRoutes =
  [
    {
      moduleId: "pos",
      routePath: ROUTES.WORKSPACE_RESTAURANT_POS,
      placeholderName: "RestaurantPosWorkspace",
    },
    {
      moduleId: "kitchen",
      routePath: ROUTES.WORKSPACE_RESTAURANT_KITCHEN,
      placeholderName: "RestaurantKitchenWorkspace",
    },
    {
      moduleId: "serving",
      routePath: ROUTES.WORKSPACE_RESTAURANT_SERVING,
      placeholderName: "RestaurantServingWorkspace",
    },
    {
      moduleId: "tables",
      routePath: ROUTES.WORKSPACE_RESTAURANT_TABLES,
      placeholderName: "RestaurantTablesWorkspace",
    },
    {
      moduleId: "menu",
      routePath: ROUTES.WORKSPACE_RESTAURANT_MENU,
      placeholderName: "RestaurantMenuWorkspace",
    },
    {
      moduleId: "recipes",
      routePath: ROUTES.WORKSPACE_RESTAURANT_RECIPES,
      placeholderName: "RestaurantRecipesWorkspace",
    },
    {
      moduleId: "orders",
      routePath: ROUTES.WORKSPACE_RESTAURANT_ORDERS,
      placeholderName: "RestaurantOrdersWorkspace",
    },
  ] as const satisfies readonly WorkspacePlaceholderRoute[];

function getExpectedRoutesForMode(
  mode: V3BusinessMode,
): readonly WorkspaceRouteExpectation[] {
  return mode === "restaurant" ? restaurantWorkspaceRouteExpectations : [];
}

function getPlaceholderRoutesForMode(
  mode: V3BusinessMode,
): readonly WorkspacePlaceholderRoute[] {
  return mode === "restaurant" ? restaurantWorkspacePlaceholderRoutes : [];
}

export function createWorkspaceRouteParityReport(
  mode: V3BusinessMode = "restaurant",
): WorkspaceRouteParityReport {
  const registryRoutes = getWorkspaceRoutesForMode(mode);
  const expectedRoutes = getExpectedRoutesForMode(mode);
  const placeholderRoutes = getPlaceholderRoutesForMode(mode);

  const registryByModuleId = new Map<V3ModuleId, WorkspaceRegistryRoute>(
    registryRoutes.map((route) => [route.moduleId, route]),
  );
  const expectedByModuleId = new Map<V3ModuleId, WorkspaceRouteExpectation>(
    expectedRoutes.map((route) => [route.moduleId, route]),
  );
  const placeholderByModuleId = new Map<V3ModuleId, WorkspacePlaceholderRoute>(
    placeholderRoutes.map((route) => [route.moduleId, route]),
  );

  const missingRegistryRoutes = expectedRoutes
    .filter((expectedRoute) => !registryByModuleId.has(expectedRoute.moduleId))
    .map((expectedRoute) => ({
      moduleId: expectedRoute.moduleId,
      expectedRoute: expectedRoute.routePath,
    }));

  const extraRegistryRoutes = registryRoutes
    .filter((registryRoute) => !expectedByModuleId.has(registryRoute.moduleId))
    .map((registryRoute) => ({
      moduleId: registryRoute.moduleId,
      routePath: registryRoute.routePath,
    }));

  const registryRouteMismatches = expectedRoutes.flatMap((expectedRoute) => {
    const registryRoute = registryByModuleId.get(expectedRoute.moduleId);

    if (!registryRoute || registryRoute.routePath === expectedRoute.routePath) {
      return [];
    }

    return [
      {
        moduleId: expectedRoute.moduleId,
        expectedRoute: expectedRoute.routePath,
        actualRoute: registryRoute.routePath,
      },
    ];
  });

  const missingPlaceholderRoutes = expectedRoutes
    .filter(
      (expectedRoute) => !placeholderByModuleId.has(expectedRoute.moduleId),
    )
    .map((expectedRoute) => ({
      moduleId: expectedRoute.moduleId,
      expectedRoute: expectedRoute.routePath,
    }));

  const extraPlaceholderRoutes = placeholderRoutes
    .filter(
      (placeholderRoute) => !expectedByModuleId.has(placeholderRoute.moduleId),
    )
    .map((placeholderRoute) => ({
      moduleId: placeholderRoute.moduleId,
      routePath: placeholderRoute.routePath,
    }));

  const placeholderRouteMismatches = expectedRoutes.flatMap(
    (expectedRoute) => {
      const placeholderRoute = placeholderByModuleId.get(expectedRoute.moduleId);

      if (
        !placeholderRoute ||
        placeholderRoute.routePath === expectedRoute.routePath
      ) {
        return [];
      }

      return [
        {
          moduleId: expectedRoute.moduleId,
          expectedRoute: expectedRoute.routePath,
          actualRoute: placeholderRoute.routePath,
        },
      ];
    },
  );

  const matchedRouteCount =
    expectedRoutes.length -
    missingRegistryRoutes.length -
    registryRouteMismatches.length;

  return {
    mode,
    registryRouteCount: registryRoutes.length,
    expectedRouteCount: expectedRoutes.length,
    placeholderRouteCount: placeholderRoutes.length,
    matchedRouteCount,
    missingRegistryRoutes,
    extraRegistryRoutes,
    registryRouteMismatches,
    missingPlaceholderRoutes,
    extraPlaceholderRoutes,
    placeholderRouteMismatches,
    passes:
      missingRegistryRoutes.length === 0 &&
      extraRegistryRoutes.length === 0 &&
      registryRouteMismatches.length === 0 &&
      missingPlaceholderRoutes.length === 0 &&
      extraPlaceholderRoutes.length === 0 &&
      placeholderRouteMismatches.length === 0,
  };
}
