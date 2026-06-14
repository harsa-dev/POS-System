import type { OrderStatus } from "@prisma/client";

export const RESTAURANT_ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
  "SERVED",
];

export const RESTAURANT_PAYMENT_QUEUE_STATUSES: readonly OrderStatus[] = ["PENDING_PAYMENT"];
export const RESTAURANT_KITCHEN_QUEUE_STATUSES: readonly OrderStatus[] = ["PAID", "PREPARING"];
export const RESTAURANT_SERVING_QUEUE_STATUSES: readonly OrderStatus[] = ["READY", "SERVED"];
export const RESTAURANT_TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = ["COMPLETED", "CANCELLED"];

export const RESTAURANT_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "CANCELLED"],
  SERVED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const RESTAURANT_WORKFLOW_STAGE_DEFINITIONS = [
  {
    id: "payment",
    title: "Payment queue",
    description: "Orders waiting for cashier/payment confirmation.",
    statuses: RESTAURANT_PAYMENT_QUEUE_STATUSES,
    reviewAgeMinutes: 15,
    blockedAgeMinutes: 30,
  },
  {
    id: "kitchen",
    title: "Kitchen queue",
    description: "Paid orders waiting for preparation or currently being prepared.",
    statuses: RESTAURANT_KITCHEN_QUEUE_STATUSES,
    reviewAgeMinutes: 20,
    blockedAgeMinutes: 40,
  },
  {
    id: "serving",
    title: "Serving queue",
    description: "Ready or served orders that still need floor follow-up.",
    statuses: RESTAURANT_SERVING_QUEUE_STATUSES,
    reviewAgeMinutes: 10,
    blockedAgeMinutes: 20,
  },
  {
    id: "completed",
    title: "Completed today",
    description: "Orders completed during the current operational day.",
    statuses: ["COMPLETED"] as const,
    reviewAgeMinutes: 0,
    blockedAgeMinutes: 0,
  },
  {
    id: "cancelled",
    title: "Cancelled today",
    description: "Orders cancelled during the current operational day.",
    statuses: ["CANCELLED"] as const,
    reviewAgeMinutes: 0,
    blockedAgeMinutes: 0,
  },
] as const;

export type RestaurantWorkflowStageId = (typeof RESTAURANT_WORKFLOW_STAGE_DEFINITIONS)[number]["id"];

export function getRestaurantAllowedNextStatuses(status: OrderStatus) {
  return RESTAURANT_ORDER_TRANSITIONS[status] ?? [];
}
