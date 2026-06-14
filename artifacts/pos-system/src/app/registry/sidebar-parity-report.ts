import {
  getCurrentSidebarPreview,
  getGeneratedSidebarPreviewForRuntimeMode,
  type SidebarPreviewItem,
} from "./sidebar-preview";

type SidebarParityIssue = Readonly<{
  current?: SidebarPreviewItem;
  generated?: SidebarPreviewItem;
  reason: string;
}>;

export type SidebarParityReport = Readonly<{
  matchingItems: readonly SidebarPreviewItem[];
  missingItems: readonly SidebarParityIssue[];
  extraItems: readonly SidebarParityIssue[];
  routeMismatches: readonly SidebarParityIssue[];
  labelMismatches: readonly SidebarParityIssue[];
  orderMismatches: readonly SidebarParityIssue[];
  rolePermissionMismatches: readonly SidebarParityIssue[];
  groupSectionMismatches: readonly SidebarParityIssue[];
  summary: {
    currentCount: number;
    generatedCount: number;
    matchingCount: number;
    missingCount: number;
    extraCount: number;
    routeMismatchCount: number;
    labelMismatchCount: number;
    orderMismatchCount: number;
    rolePermissionMismatchCount: number;
    groupSectionMismatchCount: number;
    isRouteLabelOrderParity: boolean;
    isFullParity: boolean;
  };
}>;

function sameValues<T extends string | number>(
  left: readonly T[],
  right: readonly T[],
) {
  if (left.length !== right.length) return false;

  const leftValues = [...left].sort();
  const rightValues = [...right].sort();

  return leftValues.every((value, index) => value === rightValues[index]);
}

function getLabelKey(item: SidebarPreviewItem) {
  return item.label;
}

function getRouteKey(item: SidebarPreviewItem) {
  return item.routePath;
}

function describePair(current: SidebarPreviewItem, generated: SidebarPreviewItem) {
  return `${current.label} -> ${generated.label}`;
}

export function createSidebarParityReport(
  runtimeMode: string | null | undefined = "restaurant",
): SidebarParityReport {
  const currentItems = getCurrentSidebarPreview();
  const generatedItems = getGeneratedSidebarPreviewForRuntimeMode(runtimeMode);
  const currentByRoute = new Map(currentItems.map((item) => [getRouteKey(item), item]));
  const generatedByRoute = new Map(
    generatedItems.map((item) => [getRouteKey(item), item]),
  );
  const currentByLabel = new Map(currentItems.map((item) => [getLabelKey(item), item]));
  const generatedByLabel = new Map(
    generatedItems.map((item) => [getLabelKey(item), item]),
  );

  const missingItems = currentItems
    .filter((item) => !generatedByRoute.has(item.routePath))
    .map((item): SidebarParityIssue => ({
      current: item,
      reason: "Current sidebar route is missing from generated registry sidebar.",
    }));
  const extraItems = generatedItems
    .filter((item) => !currentByRoute.has(item.routePath))
    .map((item): SidebarParityIssue => ({
      generated: item,
      reason: "Generated registry route is not present in current sidebar snapshot.",
    }));
  const routeMismatches = currentItems
    .filter((current) => {
      const generated = generatedByLabel.get(current.label);

      return generated !== undefined && generated.routePath !== current.routePath;
    })
    .map((current): SidebarParityIssue => {
      const generated = generatedByLabel.get(current.label);

      return {
        current,
        generated,
        reason: `Route mismatch for ${current.label}.`,
      };
    });
  const labelMismatches = currentItems
    .filter((current) => {
      const generated = generatedByRoute.get(current.routePath);

      return generated !== undefined && generated.label !== current.label;
    })
    .map((current): SidebarParityIssue => {
      const generated = generatedByRoute.get(current.routePath);

      return {
        current,
        generated,
        reason: `Label mismatch for ${current.routePath}.`,
      };
    });
  const orderMismatches = currentItems
    .filter((current, index) => generatedItems[index]?.routePath !== current.routePath)
    .map((current, index): SidebarParityIssue => ({
      current,
      generated: generatedItems[index],
      reason: `Order mismatch at position ${index + 1}.`,
    }));
  const rolePermissionMismatches = currentItems
    .filter((current) => {
      const generated = generatedByRoute.get(current.routePath);

      return generated !== undefined && !sameValues(current.roles, generated.roles);
    })
    .map((current): SidebarParityIssue => {
      const generated = generatedByRoute.get(current.routePath);

      return {
        current,
        generated,
        reason: generated
          ? `Role mismatch for ${describePair(current, generated)}.`
          : "Generated item missing for role comparison.",
      };
    });
  const groupSectionMismatches = currentItems
    .filter((current) => {
      const generated = generatedByRoute.get(current.routePath);

      return generated !== undefined && generated.group !== current.group;
    })
    .map((current): SidebarParityIssue => {
      const generated = generatedByRoute.get(current.routePath);

      return {
        current,
        generated,
        reason: generated
          ? `Group mismatch for ${describePair(current, generated)}.`
          : "Generated item missing for group comparison.",
      };
    });
  const matchingItems = currentItems.filter((current) => {
    const generated = generatedByRoute.get(current.routePath);

    return (
      generated !== undefined &&
      generated.label === current.label &&
      generated.order === current.order &&
      sameValues(current.roles, generated.roles)
    );
  });
  const isRouteLabelOrderParity =
    missingItems.length === 0 &&
    extraItems.length === 0 &&
    routeMismatches.length === 0 &&
    labelMismatches.length === 0 &&
    orderMismatches.length === 0;
  const isFullParity =
    isRouteLabelOrderParity &&
    rolePermissionMismatches.length === 0 &&
    groupSectionMismatches.length === 0;

  return {
    matchingItems,
    missingItems,
    extraItems,
    routeMismatches,
    labelMismatches,
    orderMismatches,
    rolePermissionMismatches,
    groupSectionMismatches,
    summary: {
      currentCount: currentItems.length,
      generatedCount: generatedItems.length,
      matchingCount: matchingItems.length,
      missingCount: missingItems.length,
      extraCount: extraItems.length,
      routeMismatchCount: routeMismatches.length,
      labelMismatchCount: labelMismatches.length,
      orderMismatchCount: orderMismatches.length,
      rolePermissionMismatchCount: rolePermissionMismatches.length,
      groupSectionMismatchCount: groupSectionMismatches.length,
      isRouteLabelOrderParity,
      isFullParity,
    },
  };
}
