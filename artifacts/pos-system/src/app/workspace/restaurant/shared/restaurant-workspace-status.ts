export const restaurantOrderStatusLabels = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export const restaurantOrderStatusTones = {
  PENDING_PAYMENT: "bg-yellow-50 text-yellow-700",
  PAID: "bg-blue-50 text-blue-700",
  PREPARING: "bg-orange-50 text-orange-700",
  READY: "bg-green-50 text-green-700",
  SERVED: "bg-purple-50 text-purple-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
} as const;

export type RestaurantOrderStatus = keyof typeof restaurantOrderStatusLabels;

export const kitchenOrderStatusLabels = {
  PAID: "Queued",
  PREPARING: "Cooking",
} as const;

export const servingOrderStatusLabels = {
  READY: "Ready",
} as const;

export const restaurantTableStatusLabels = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  CLEANING: "Cleaning",
  RESERVED: "Reserved",
  INACTIVE: "Inactive",
  UNKNOWN: "Unknown",
} as const;

export const restaurantTableStatusTones = {
  AVAILABLE: "bg-green-50 text-green-700",
  OCCUPIED: "bg-red-50 text-red-700",
  CLEANING: "bg-yellow-50 text-yellow-700",
  RESERVED: "bg-blue-50 text-blue-700",
  INACTIVE: "bg-neutral-100 text-neutral-500",
  UNKNOWN: "bg-neutral-100 text-neutral-700",
} as const;

export type RestaurantTableStatus = keyof typeof restaurantTableStatusLabels;

export const menuAvailabilityLabels = {
  AVAILABLE: "Available",
  OUT_OF_STOCK: "Out of Stock",
  NO_RECIPE: "No Recipe",
  UNAVAILABLE: "Unavailable",
} as const;

export const menuAvailabilityTones = {
  AVAILABLE: "bg-green-50 text-green-700",
  OUT_OF_STOCK: "bg-red-50 text-red-700",
  NO_RECIPE: "bg-yellow-50 text-yellow-700",
  UNAVAILABLE: "bg-neutral-100 text-neutral-600",
} as const;

export type MenuAvailabilityStatus = keyof typeof menuAvailabilityLabels;

export function isRestaurantOrderStatus(
  status: string,
): status is RestaurantOrderStatus {
  return status in restaurantOrderStatusLabels;
}

export function normalizeRestaurantTableStatus(
  status?: string | null,
): RestaurantTableStatus {
  if (
    status === "AVAILABLE" ||
    status === "OCCUPIED" ||
    status === "CLEANING" ||
    status === "RESERVED" ||
    status === "INACTIVE"
  ) {
    return status;
  }

  return "UNKNOWN";
}

export function normalizeMenuAvailabilityStatus(
  availabilityStatus?: string | null,
): MenuAvailabilityStatus {
  if (
    availabilityStatus === "AVAILABLE" ||
    availabilityStatus === "OUT_OF_STOCK" ||
    availabilityStatus === "NO_RECIPE" ||
    availabilityStatus === "UNAVAILABLE"
  ) {
    return availabilityStatus;
  }

  return "NO_RECIPE";
}

export function formatRestaurantStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatRestaurantTime(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRestaurantQuantity(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}
