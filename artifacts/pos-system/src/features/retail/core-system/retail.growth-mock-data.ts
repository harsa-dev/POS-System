export type RetailBusinessScale = "small" | "medium" | "large";

export type RetailGrowthModuleId =
  | "customers-loyalty"
  | "returns-exchanges"
  | "staff-shifts"
  | "multi-location"
  | "omnichannel"
  | "forecasting"
  | "audit-controls";

export type RetailGrowthMetric = Readonly<{
  label: string;
  value: string;
  helper: string;
}>;

export type RetailGrowthRow = Readonly<{
  title: string;
  primary: string;
  secondary: string;
  status: "healthy" | "review" | "blocked" | "planned";
}>;

export type RetailGrowthModule = Readonly<{
  id: RetailGrowthModuleId;
  title: string;
  eyebrow: string;
  scale: RetailBusinessScale;
  description: string;
  whyItMatters: string;
  dashboardGoal: string;
  metrics: readonly RetailGrowthMetric[];
  rows: readonly RetailGrowthRow[];
  nextMockSteps: readonly string[];
}>;

export type RetailScaleProfile = Readonly<{
  scale: RetailBusinessScale;
  title: string;
  exampleBusiness: string;
  mustHave: readonly string[];
  alreadyCovered: readonly string[];
  addedNow: readonly RetailGrowthModuleId[];
}>;

export type RetailCoverageItem = Readonly<{
  feature: string;
  scale: RetailBusinessScale;
  status: "covered" | "added-mock" | "future-api";
  currentSurface: string;
  note: string;
}>;

export const retailScaleProfiles: readonly RetailScaleProfile[] = [
  {
    scale: "small",
    title: "Small retail / single outlet",
    exampleBusiness: "warung modern, butik kecil, toko aksesoris, minimarket lokal",
    mustHave: ["Fast checkout", "Barcode/SKU", "Basic inventory", "Daily report", "Cash drawer", "Returns", "Basic loyalty"],
    alreadyCovered: ["cashier", "catalog", "barcode", "operations report", "stock alert"],
    addedNow: ["customers-loyalty", "returns-exchanges"],
  },
  {
    scale: "medium",
    title: "Medium retail / growing store",
    exampleBusiness: "toko dengan beberapa kasir, supplier rutin, promo mingguan, stok lebih banyak",
    mustHave: ["Supplier receiving", "Stock opname", "Promo control", "Staff shifts", "Customer segment", "Return approval", "Purchase planning"],
    alreadyCovered: ["receiving", "stock-opname", "promotions", "manager review"],
    addedNow: ["staff-shifts", "forecasting"],
  },
  {
    scale: "large",
    title: "Large retail / multi-branch operation",
    exampleBusiness: "multi-outlet retail, chain store, hybrid offline-online seller",
    mustHave: ["Multi-location stock", "Store transfer", "Omnichannel orders", "Audit controls", "Forecasting", "Approval rules", "Accounting export"],
    alreadyCovered: ["quality checks", "readiness score", "activity timeline"],
    addedNow: ["multi-location", "omnichannel", "audit-controls"],
  },
];

export const retailGrowthModules: readonly RetailGrowthModule[] = [
  {
    id: "customers-loyalty",
    title: "Customers & Loyalty",
    eyebrow: "Small retail growth feature",
    scale: "small",
    description: "Dummy CRM and loyalty surface for repeat customer tracking, points, member tiers, and customer value.",
    whyItMatters: "Small retailers need repeat purchases. A simple customer ledger is often more useful than a decorative analytics chart.",
    dashboardGoal: "Show loyalty members, points liability, top customers, and retention signals.",
    metrics: [
      { label: "Members", value: "428", helper: "Dummy active loyalty members" },
      { label: "Repeat rate", value: "38%", helper: "Mock customers with more than one purchase" },
      { label: "Points liability", value: "Rp 1.280.000", helper: "Estimated value of unredeemed points" },
    ],
    rows: [
      { title: "Nadia Putri", primary: "Gold member · 18 visits", secondary: "Last purchase Rp 186.000 · 1.240 points", status: "healthy" },
      { title: "Raka Aditya", primary: "Silver member · 9 visits", secondary: "Eligible for birthday voucher", status: "review" },
      { title: "Walk-in customers", primary: "62% of today's transactions", secondary: "Prompt cashier to ask phone number after checkout", status: "planned" },
    ],
    nextMockSteps: ["Add customer search mock", "Add points earn/redeem preview", "Add segment filter"],
  },
  {
    id: "returns-exchanges",
    title: "Returns & Exchanges",
    eyebrow: "Small retail control feature",
    scale: "small",
    description: "Dummy return desk for refund, exchange, receipt validation, return reason, and manager approval.",
    whyItMatters: "Even small stores need a return policy. Without it, refund handling becomes cashier folklore.",
    dashboardGoal: "Show pending returns, reason mix, restockable items, and refund value.",
    metrics: [
      { label: "Pending review", value: "3", helper: "Mock returns waiting manager decision" },
      { label: "Refund value", value: "Rp 642.000", helper: "Potential refund today" },
      { label: "Restockable", value: "71%", helper: "Returned items safe for shelf" },
    ],
    rows: [
      { title: "RET-2406-018", primary: "Receipt RCPT-2406-002 · Exchange request", secondary: "Size mismatch · restock allowed", status: "healthy" },
      { title: "RET-2406-019", primary: "No receipt · refund requested", secondary: "Needs manager approval", status: "blocked" },
      { title: "RET-2406-020", primary: "Damaged packaging", secondary: "Move to write-off queue", status: "review" },
    ],
    nextMockSteps: ["Add return reason selector", "Add refund method preview", "Add restock/write-off card"],
  },
  {
    id: "staff-shifts",
    title: "Retail Staff & Shifts",
    eyebrow: "Medium retail accountability feature",
    scale: "medium",
    description: "Dummy staff dashboard for cashier shifts, register handover, break tracking, and sales per staff.",
    whyItMatters: "Once there is more than one cashier, money needs accountability. Tragic that this must be stated.",
    dashboardGoal: "Show who is working, register variance, sales per cashier, and approval needs.",
    metrics: [
      { label: "Open shifts", value: "4", helper: "Mock active cashier/store staff shifts" },
      { label: "Register variance", value: "Rp 18.500", helper: "Expected vs counted cash" },
      { label: "Top cashier", value: "Alya", helper: "Rp 2.140.000 sales today" },
    ],
    rows: [
      { title: "Alya · Register 01", primary: "Open 08:00 · Sales Rp 2.140.000", secondary: "Cash variance Rp 0", status: "healthy" },
      { title: "Bima · Register 02", primary: "Open 10:00 · Sales Rp 1.380.000", secondary: "Cash variance Rp 18.500", status: "review" },
      { title: "Dewi · Floor staff", primary: "Shelf refill assigned", secondary: "Aisle A and C pending", status: "planned" },
    ],
    nextMockSteps: ["Add shift handover checklist", "Add cashier performance cards", "Add attendance timeline"],
  },
  {
    id: "multi-location",
    title: "Multi-location Retail",
    eyebrow: "Large retail control tower",
    scale: "large",
    description: "Dummy branch dashboard for sales, stock, transfers, and branch-level risk.",
    whyItMatters: "Multi-store retail needs one stock truth, not five branches inventing reality separately.",
    dashboardGoal: "Show outlet comparison, transfer needs, low-stock branch, and overstock branch.",
    metrics: [
      { label: "Branches", value: "5", helper: "Mock active retail outlets" },
      { label: "Transfer needed", value: "12 SKU", helper: "Low in one branch, excess in another" },
      { label: "Best branch", value: "Central", helper: "Rp 8.740.000 sales today" },
    ],
    rows: [
      { title: "Central Store", primary: "Sales Rp 8.740.000 · 98% stock health", secondary: "Can transfer 18 units to East Store", status: "healthy" },
      { title: "East Store", primary: "Sales Rp 3.120.000 · 14 low-stock SKUs", secondary: "Needs beverage and snack transfer", status: "review" },
      { title: "Pop-up Booth", primary: "Offline sync delayed", secondary: "Hold reconciliation until sync", status: "blocked" },
    ],
    nextMockSteps: ["Add branch selector", "Add transfer order mock", "Add branch KPI table"],
  },
  {
    id: "omnichannel",
    title: "Omnichannel Orders",
    eyebrow: "Large retail online-offline feature",
    scale: "large",
    description: "Dummy online channel dashboard for marketplace, website, pickup, and store fulfillment.",
    whyItMatters: "Once online sales exist, stock must not be sold twice. Humanity has suffered enough from overselling.",
    dashboardGoal: "Show online order queue, channel sync status, pickup orders, and fulfillment SLA.",
    metrics: [
      { label: "Online orders", value: "27", helper: "Dummy web/marketplace orders today" },
      { label: "Pickup pending", value: "6", helper: "Ready for customer pickup" },
      { label: "Sync health", value: "94%", helper: "Mock channel sync score" },
    ],
    rows: [
      { title: "WEB-2406-044", primary: "Click-and-collect · Central Store", secondary: "Ready for pickup before 17:00", status: "healthy" },
      { title: "MKT-2406-018", primary: "Marketplace order · East Store", secondary: "Stock reservation pending", status: "review" },
      { title: "WEB-2406-051", primary: "Website order · payment confirmed", secondary: "Blocked because SKU is out of stock", status: "blocked" },
    ],
    nextMockSteps: ["Add channel filter", "Add pickup board", "Add stock reservation preview"],
  },
  {
    id: "forecasting",
    title: "Forecasting & Purchase Planning",
    eyebrow: "Medium to large planning feature",
    scale: "medium",
    description: "Dummy demand planning dashboard for reorder suggestion, dead stock, fast movers, and purchase budget.",
    whyItMatters: "Retail profit is also not buying silly quantities of slow-moving stock. Revolutionary, apparently.",
    dashboardGoal: "Show reorder recommendations, fast movers, dead stock, and estimated purchase budget.",
    metrics: [
      { label: "Reorder SKUs", value: "8", helper: "Below reorder point or projected stockout" },
      { label: "Dead stock", value: "5 SKU", helper: "Low movement in mock period" },
      { label: "Buy budget", value: "Rp 4.850.000", helper: "Suggested next purchase spend" },
    ],
    rows: [
      { title: "Mineral Water 600ml", primary: "Projected stockout in 2 days", secondary: "Suggested order 96 units", status: "review" },
      { title: "Premium Notebook A5", primary: "Slow moving · 42 days cover", secondary: "Hold purchase until sell-through improves", status: "planned" },
      { title: "Chocolate Wafer", primary: "Fast mover · promo lift detected", secondary: "Increase reorder by 20%", status: "healthy" },
    ],
    nextMockSteps: ["Add reorder formula preview", "Add fast/slow mover segmentation", "Add purchase budget simulation"],
  },
  {
    id: "audit-controls",
    title: "Audit Controls",
    eyebrow: "Large retail governance feature",
    scale: "large",
    description: "Dummy control dashboard for voids, refunds, stock variance, price override, and review queue.",
    whyItMatters: "At larger scale, tiny mistakes become expensive patterns. Spreadsheets are not a shield.",
    dashboardGoal: "Show review events, approval queue, high-impact action types, and control readiness.",
    metrics: [
      { label: "Review events", value: "9", helper: "Mock void/refund/variance events" },
      { label: "Approval queue", value: "5", helper: "Actions waiting manager review" },
      { label: "Control score", value: "82/100", helper: "Mock governance readiness score" },
    ],
    rows: [
      { title: "Repeated voids · Register 02", primary: "4 void attempts in one shift", secondary: "Require manager reason and audit note", status: "review" },
      { title: "Manual price override", primary: "SKU RT-SNK-002 discounted 35%", secondary: "Blocked above configured threshold", status: "blocked" },
      { title: "Stock variance pattern", primary: "Beverage shelf variance repeated", secondary: "Assign recount note", status: "review" },
    ],
    nextMockSteps: ["Add review filter", "Add approval decision mock", "Map events to future audit log schema"],
  },
];

export const retailGrowthModuleIds = retailGrowthModules.map((module) => module.id) as readonly RetailGrowthModuleId[];

export const retailCoverageItems: readonly RetailCoverageItem[] = [
  { feature: "Fast checkout", scale: "small", status: "covered", currentSurface: "Retail Cashier", note: "Scanner, cart, payment preview, and stock blocking already exist." },
  { feature: "Product catalog and SKU", scale: "small", status: "covered", currentSurface: "Catalog + Barcode", note: "SKU, barcode lookup, category, shelf, price, and stock fields already exist." },
  { feature: "Basic sales and inventory report", scale: "small", status: "covered", currentSurface: "Operations Panel", note: "Daily report, receipt preview, and inventory risk already exist." },
  { feature: "Customer loyalty", scale: "small", status: "added-mock", currentSurface: "Customers & Loyalty", note: "Added member, points, repeat rate, and segment surface." },
  { feature: "Returns and exchanges", scale: "small", status: "added-mock", currentSurface: "Returns & Exchanges", note: "Added return desk with refund review states." },
  { feature: "Supplier receiving", scale: "medium", status: "covered", currentSurface: "Receiving", note: "PO/receiving preview and missing quantity already exist." },
  { feature: "Staff shift accountability", scale: "medium", status: "added-mock", currentSurface: "Retail Staff & Shifts", note: "Added cashier shifts, variance, and handover needs." },
  { feature: "Forecasting and purchase planning", scale: "medium", status: "added-mock", currentSurface: "Forecasting", note: "Added reorder, dead stock, fast mover, and budget planning." },
  { feature: "Multi-location operation", scale: "large", status: "added-mock", currentSurface: "Multi-location", note: "Added branches, transfer needs, and branch risks." },
  { feature: "Omnichannel order sync", scale: "large", status: "added-mock", currentSurface: "Omnichannel", note: "Added online orders, pickup, and channel sync health." },
  { feature: "Audit controls", scale: "large", status: "added-mock", currentSurface: "Audit Controls", note: "Added void, refund, price override, and variance review surface." },
  { feature: "Real accounting export", scale: "large", status: "future-api", currentSurface: "Documentation later", note: "Keep outside mock until API contracts and auth rules are defined." },
];
