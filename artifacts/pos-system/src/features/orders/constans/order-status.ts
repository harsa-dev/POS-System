import { OrderStatus } from "@prisma/client";

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.SERVED,
];

export const COMPLETED_ORDER_STATUSES: OrderStatus[] = [OrderStatus.COMPLETED];

export const CANCELLED_ORDER_STATUSES: OrderStatus[] = [OrderStatus.CANCELLED];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending Payment",

  PAID: "Paid",

  PREPARING: "Preparing",

  READY: "Ready",

  SERVED: "Served",

  COMPLETED: "Completed",

  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700 border-yellow-200",

  PAID: "bg-blue-100 text-blue-700 border-blue-200",

  PREPARING: "bg-orange-100 text-orange-700 border-orange-200",

  READY: "bg-green-100 text-green-700 border-green-200",

  SERVED: "bg-purple-100 text-purple-700 border-purple-200",

  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",

  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [OrderStatus.PAID, OrderStatus.CANCELLED],

  PAID: [OrderStatus.PREPARING, OrderStatus.CANCELLED],

  PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],

  READY: [OrderStatus.SERVED, OrderStatus.CANCELLED],

  SERVED: [OrderStatus.COMPLETED],

  COMPLETED: [],

  CANCELLED: [],
};
