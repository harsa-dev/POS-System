
export function formatCurrency(
  amount: number,
  currency = "IDR",
  locale = "id-ID",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(amount);
}

export function formatDateTime(
  date: Date | string,
  timezone = "Asia/Makassar",
  locale = "id-ID",
) {
  return new Date(date).toLocaleString(locale, {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatOrderNumber(
  orderNumber: number,
  prefix = "ORD",
) {
  return `${prefix}-${String(orderNumber).padStart(6, "0")}`;
}