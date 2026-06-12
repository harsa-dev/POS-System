import {
  permissionKeys,
  requirePermission,
} from "../permissions/index.js";
import type { InventoryActor } from "./inventory.types.js";

export function requireInventoryView(actor: InventoryActor) {
  requirePermission(actor.role, permissionKeys.shared.inventory.view);
}

export function requireInventoryAdjust(actor: InventoryActor) {
  requirePermission(actor.role, permissionKeys.shared.inventory.adjust);
}
