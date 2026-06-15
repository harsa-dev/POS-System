import type {
  SalesAnalyticsOrderStatus,
  SalesAnalyticsQuery,
} from "@/lib/api/sales-analytics-api";

export const SALES_ANALYTICS_FILTER_SYNC_EVENT = "sales-analytics:filter-sync";
export const SALES_ANALYTICS_FILTER_STORAGE_KEY = "sales-analytics:filter-context";

const ALL_PRODUCTS = "__all_products__";
const ALL_CATEGORIES = "__all_categories__";
const ALL_PAYMENT_METHODS = "__all_payment_methods__";
const ALL_ORDER_STATUSES = "__all_order_statuses__";
const DEFAULT_PAGE_SIZE = 10;

export type SalesAnalyticsFilterContext = {
  label: string;
  query: SalesAnalyticsQuery;
  filters: {
    dateRange: string;
    productLabel: string;
    categoryLabel: string;
    paymentMethodLabel: string;
    orderStatusLabel: string;
    search: string;
  };
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function getDateRangeQuery(dateRange: string) {
  const now = new Date();

  if (dateRange === "Today") {
    return {
      from: startOfDay(now).toISOString(),
      to: endOfDay(now).toISOString(),
    };
  }

  if (dateRange === "This Week") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const start = startOfDay(new Date(now));
    start.setDate(start.getDate() - diffToMonday);

    return {
      from: start.toISOString(),
      to: endOfDay(now).toISOString(),
    };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  return {
    from: monthStart.toISOString(),
    to: endOfDay(now).toISOString(),
  };
}

function readLabeledControl(label: string) {
  if (typeof document === "undefined") return null;

  const labels = Array.from(document.querySelectorAll<HTMLSpanElement>("span.sr-only"));
  const match = labels.find((item) => item.textContent?.trim() === label);
  const container = match?.closest("label") ?? match?.parentElement;

  return (
    container?.querySelector<HTMLSelectElement | HTMLInputElement>("select, input") ??
    null
  );
}

function readControlValue(label: string, fallback: string) {
  return readLabeledControl(label)?.value ?? fallback;
}

function readControlLabel(label: string, fallback: string) {
  const control = readLabeledControl(label);

  if (control instanceof HTMLSelectElement) {
    return control.selectedOptions[0]?.textContent?.trim() || fallback;
  }

  return control?.value?.trim() || fallback;
}

export function buildSalesAnalyticsFilterContext(input?: {
  dateRange?: string;
  productId?: string;
  productLabel?: string;
  categoryId?: string;
  categoryLabel?: string;
  paymentMethod?: string;
  paymentMethodLabel?: string;
  orderStatus?: string;
  orderStatusLabel?: string;
  search?: string;
}): SalesAnalyticsFilterContext {
  const dateRange = input?.dateRange || "This Month";
  const productId = input?.productId || ALL_PRODUCTS;
  const categoryId = input?.categoryId || ALL_CATEGORIES;
  const paymentMethod = input?.paymentMethod || ALL_PAYMENT_METHODS;
  const orderStatus = input?.orderStatus || ALL_ORDER_STATUSES;
  const search = input?.search?.trim() ?? "";

  const query: SalesAnalyticsQuery = {
    ...getDateRangeQuery(dateRange),
    basis: "paid",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    productId: productId === ALL_PRODUCTS ? undefined : productId,
    categoryId: categoryId === ALL_CATEGORIES ? undefined : categoryId,
    paymentMethod: paymentMethod === ALL_PAYMENT_METHODS ? undefined : paymentMethod,
    orderStatus:
      orderStatus === ALL_ORDER_STATUSES
        ? undefined
        : (orderStatus as SalesAnalyticsOrderStatus),
    q: search || undefined,
  };

  return {
    label: `${dateRange} · Paid Sales`,
    query,
    filters: {
      dateRange,
      productLabel: input?.productLabel || "All Products",
      categoryLabel: input?.categoryLabel || "All Categories",
      paymentMethodLabel: input?.paymentMethodLabel || "All Payment Methods",
      orderStatusLabel: input?.orderStatusLabel || "All Order Statuses",
      search,
    },
  };
}

export function readSalesAnalyticsFilterContextFromDom() {
  return buildSalesAnalyticsFilterContext({
    productId: readControlValue("Product Filter", ALL_PRODUCTS),
    productLabel: readControlLabel("Product Filter", "All Products"),
    categoryId: readControlValue("Category Filter", ALL_CATEGORIES),
    categoryLabel: readControlLabel("Category Filter", "All Categories"),
    paymentMethod: readControlValue("Payment Method Filter", ALL_PAYMENT_METHODS),
    paymentMethodLabel: readControlLabel("Payment Method Filter", "All Payment Methods"),
    orderStatus: readControlValue("Order Status Filter", ALL_ORDER_STATUSES),
    orderStatusLabel: readControlLabel("Order Status Filter", "All Order Statuses"),
    search: readControlValue("Product Search", ""),
    dateRange: readControlValue("Date Range Filter", "This Month"),
  });
}

export function getInitialSalesAnalyticsFilterContext() {
  if (typeof window === "undefined") {
    return buildSalesAnalyticsFilterContext();
  }

  try {
    const stored = window.sessionStorage.getItem(SALES_ANALYTICS_FILTER_STORAGE_KEY);
    if (!stored) return buildSalesAnalyticsFilterContext();

    return JSON.parse(stored) as SalesAnalyticsFilterContext;
  } catch {
    return buildSalesAnalyticsFilterContext();
  }
}

export function publishSalesAnalyticsFilterContext(context: SalesAnalyticsFilterContext) {
  if (typeof window === "undefined") return;

  const next = JSON.stringify(context);
  const current = window.sessionStorage.getItem(SALES_ANALYTICS_FILTER_STORAGE_KEY);

  if (current === next) return;

  window.sessionStorage.setItem(SALES_ANALYTICS_FILTER_STORAGE_KEY, next);
  window.dispatchEvent(
    new CustomEvent<SalesAnalyticsFilterContext>(SALES_ANALYTICS_FILTER_SYNC_EVENT, {
      detail: context,
    }),
  );
}
