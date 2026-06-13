import type { RetailWorkspaceModuleId } from "@/features/retail/core-system";

import RetailInteractiveWorkspace from "./retail-interactive-workspace";
import { RetailOperationsPanel } from "./retail-operations-panel";

type RetailWorkspaceProps = {
  moduleId: RetailWorkspaceModuleId;
};

export default function RetailWorkspace({ moduleId }: RetailWorkspaceProps) {
  return (
    <>
      <RetailInteractiveWorkspace moduleId={moduleId} />
      <RetailOperationsPanel />
    </>
  );
}
