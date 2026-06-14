"use client";

import { useEffect, useState } from "react";

import { businessModeService } from "@/components/core/business-mode/business-mode-service";

import {
  getSharedDashboardModeContext,
  type SharedDashboardModeContext,
  type SharedDashboardSurfaceId,
} from "./shared-dashboard-mode-context";

export function useSharedDashboardModeContext(
  surfaceId: SharedDashboardSurfaceId,
): SharedDashboardModeContext {
  const [context, setContext] = useState(() => getSharedDashboardModeContext(surfaceId));

  useEffect(() => {
    setContext(getSharedDashboardModeContext(surfaceId));

    return businessModeService.subscribe(() => {
      setContext(getSharedDashboardModeContext(surfaceId));
    });
  }, [surfaceId]);

  return context;
}
