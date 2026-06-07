import type {
  PosCartItem,
  PosCartTotals,
  PosOrderDraft,
  PosOrderDraftValidationIssue,
  PosOrderType,
  PosTableItem,
} from "./pos-workspace-types";

type BuildPosOrderDraftInput = {
  cartItems: PosCartItem[];
  selectedTable: PosTableItem | null;
  totals: PosCartTotals;
  orderType: PosOrderType;
  notes: string;
};

export function buildPosOrderDraft({
  cartItems,
  selectedTable,
  totals,
  orderType,
  notes,
}: BuildPosOrderDraftInput): PosOrderDraft {
  const errors: PosOrderDraftValidationIssue[] = [];
  const warnings: PosOrderDraftValidationIssue[] = [];

  if (cartItems.length === 0) {
    errors.push({
      code: "CART_EMPTY",
      message: "Add at least one item before this draft can be submitted.",
    });
  }

  if (orderType === "DINE_IN" && selectedTable === null) {
    errors.push({
      code: "MISSING_TABLE",
      message: "Select a table for dine-in orders.",
    });
  }

  if (cartItems.some((item) => item.quantity < 1)) {
    errors.push({
      code: "INVALID_ITEM_QUANTITY",
      message: "Each draft item must have a quantity of at least 1.",
    });
  }

  if (selectedTable && selectedTable.status !== "AVAILABLE") {
    warnings.push({
      code: "TABLE_NOT_AVAILABLE",
      message: `${selectedTable.name} is currently ${selectedTable.status.toLowerCase()}.`,
    });
  }

  return {
    orderType,
    table: selectedTable
      ? {
          id: selectedTable.id,
          name: selectedTable.name,
        }
      : null,
    notes,
    items: cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
    })),
    totals,
    errors,
    warnings,
    isLocallyValid: errors.length === 0,
  };
}
