import type { RetailWorkspaceModuleId } from "@/features/retail/core-system";

import RetailInteractiveWorkspace from "./retail-interactive-workspace";
import { RetailOperationsPanel } from "./retail-operations-panel";
import { RetailQualityPanel } from "./retail-quality-panel";
import RetailReceivingApiWorkspace from "./retail-receiving-api-workspace";

type RetailWorkspaceProps = {
  moduleId: RetailWorkspaceModuleId;
};

export default function RetailWorkspace({ moduleId }: RetailWorkspaceProps) {
  return (
    <>
      {moduleId === "receiving" ? (
        <RetailReceivingApiWorkspace />
      ) : (
        <RetailInteractiveWorkspace moduleId={moduleId} />
      )}
      <RetailOperationsPanel />
      <RetailQualityPanel />
    </>
  );
}
