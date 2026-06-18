import type { RetailWorkspaceModuleId } from "@/features/retail/core-system";

import RetailBarcodeApiWorkspace from "./retail-barcode-api-workspace";
import RetailComingSoonWorkspace from "./retail-coming-soon-workspace";
import { RetailOperationsPanel } from "./retail-operations-panel";
import { RetailPromotionsApiWorkspace } from "./retail-promotions-api-workspace";
import { RetailQualityPanel } from "./retail-quality-panel";
import RetailReceivingApiWorkspace from "./retail-receiving-api-workspace";
import RetailReturnsApiWorkspace from "./retail-returns-api-workspace";
import RetailShelfApiWorkspace from "./retail-shelf-api-workspace";
import RetailStockOpnameApiWorkspace from "./retail-stock-opname-api-workspace";
import { RetailApiWorkspace } from "./retail-api-workspace";

type RetailWorkspaceProps = {
  moduleId: RetailWorkspaceModuleId | string;
};

const CORE_MODULES = new Set<string>([
  "cashier", "catalog", "barcode", "receiving",
  "stock-opname", "shelf-management", "promotions", "returns-exchanges",
]);

function RetailModuleContent({ moduleId }: RetailWorkspaceProps) {
  if (moduleId === "cashier" || moduleId === "catalog") {
    return <RetailApiWorkspace moduleId={moduleId as "cashier" | "catalog"} />;
  }
  if (moduleId === "barcode") {
    return <RetailBarcodeApiWorkspace />;
  }
  if (moduleId === "receiving") {
    return <RetailReceivingApiWorkspace />;
  }
  if (moduleId === "stock-opname") {
    return <RetailStockOpnameApiWorkspace />;
  }
  if (moduleId === "shelf-management") {
    return <RetailShelfApiWorkspace />;
  }
  if (moduleId === "promotions") {
    return <RetailPromotionsApiWorkspace />;
  }
  if (moduleId === "returns-exchanges") {
    return <RetailReturnsApiWorkspace />;
  }
  if (!CORE_MODULES.has(moduleId)) {
    return <RetailComingSoonWorkspace moduleId={moduleId} />;
  }
  return <RetailApiWorkspace moduleId="cashier" />;
}

export default function RetailWorkspace({ moduleId }: RetailWorkspaceProps) {
  return (
    <>
      <RetailModuleContent moduleId={moduleId} />
      <RetailOperationsPanel />
      <RetailQualityPanel />
    </>
  );
}
