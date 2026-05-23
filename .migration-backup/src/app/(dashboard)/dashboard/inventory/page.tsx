import { InventoryManager } from "@/components/inventory/inventory-manager";

import { requireRole } from "@/lib/auth/require-role";

export default async function InventoryPage() {
  await requireRole(["OWNER", "MANAGER"]);

  return <InventoryManager />;
}