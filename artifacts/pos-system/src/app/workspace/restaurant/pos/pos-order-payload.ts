import type { RestaurantOrderPreviewInput } from "@/lib/api";

import type { PosOrderDraft } from "./pos-workspace-types";

export type CreateOrderPaymentMethod = "CASH" | "QRIS" | "CARD" | "TRANSFER";

export type CreateOrderPayload = RestaurantOrderPreviewInput & {
  paymentMethod: CreateOrderPaymentMethod;
  amountPaid: number;
  type: PosOrderDraft["orderType"];
  tableId: string | null;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
};

export type CreateOrderPayloadValidationIssue = {
  code:
    | "CART_EMPTY"
    | "MISSING_TABLE"
    | "TABLE_NOT_AVAILABLE"
    | "TAKEAWAY_TABLE_ID"
    | "INVALID_ITEM_QUANTITY"
    | "INVALID_AMOUNT_PAID"
    | "INSUFFICIENT_CASH_AMOUNT";
  message: string;
};

export type CreateOrderPayloadPreview = {
  payload: CreateOrderPayload;
  errors: CreateOrderPayloadValidationIssue[];
  isReady: boolean;
};

type MapPosOrderDraftToCreateOrderPayloadInput = {
  draft: PosOrderDraft;
  paymentMethod: CreateOrderPaymentMethod;
  amountPaid: number;
};

export function mapPosOrderDraftToCreateOrderPayload({
  draft,
  paymentMethod,
  amountPaid,
}: MapPosOrderDraftToCreateOrderPayloadInput): CreateOrderPayload {
  return {
    paymentMethod,
    amountPaid,
    type: draft.orderType,
    tableId: draft.orderType === "DINE_IN" ? draft.table?.id ?? null : null,
    items: draft.items.map((item) => ({
      menuItemId: item.productId,
      quantity: item.quantity,
    })),
  };
}

export function buildCreateOrderPayloadPreview(
  input: MapPosOrderDraftToCreateOrderPayloadInput,
): CreateOrderPayloadPreview {
  const payload = mapPosOrderDraftToCreateOrderPayload(input);
  const errors: CreateOrderPayloadValidationIssue[] = [];

  if (payload.items.length === 0) {
    errors.push({
      code: "CART_EMPTY",
      message: "Payload requires at least one item.",
    });
  }

  if (payload.type === "DINE_IN" && payload.tableId === null) {
    errors.push({
      code: "MISSING_TABLE",
      message: "Dine-in payload requires a tableId.",
    });
  }

  if (input.draft.errors.some((error) => error.code === "TABLE_NOT_AVAILABLE")) {
    errors.push({
      code: "TABLE_NOT_AVAILABLE",
      message: "Dine-in payload requires an available table.",
    });
  }

  if (payload.type === "TAKEAWAY" && payload.tableId !== null) {
    errors.push({
      code: "TAKEAWAY_TABLE_ID",
      message: "Takeaway payload must send tableId as null.",
    });
  }

  if (
    payload.items.some(
      (item) => !Number.isInteger(item.quantity) || item.quantity < 1,
    )
  ) {
    errors.push({
      code: "INVALID_ITEM_QUANTITY",
      message: "Payload quantities must be positive integers.",
    });
  }

  if (!Number.isFinite(payload.amountPaid) || payload.amountPaid < 0) {
    errors.push({
      code: "INVALID_AMOUNT_PAID",
      message: "amountPaid must be a valid non-negative number.",
    });
  }

  if (
    payload.paymentMethod === "CASH" &&
    Number.isFinite(payload.amountPaid) &&
    payload.amountPaid < input.draft.totals.total
  ) {
    errors.push({
      code: "INSUFFICIENT_CASH_AMOUNT",
      message: "Cash amountPaid should be at least the preview total.",
    });
  }

  return {
    payload,
    errors,
    isReady: errors.length === 0,
  };
}
