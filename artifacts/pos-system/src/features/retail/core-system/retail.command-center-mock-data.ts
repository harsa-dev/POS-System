export type RetailCommandPriority = "low" | "medium" | "high";

export type RetailCommandMetric = Readonly<{
  label: string;
  value: string;
  helper: string;
  trend: "up" | "down" | "flat";
}>;

export type RetailCommandAction = Readonly<{
  title: string;
  owner: string;
  priority: RetailCommandPriority;
  impact: string;
  nextStep: string;
}>;

export type RetailPlanningSignal = Readonly<{
  area: string;
  signal: string;
  recommendation: string;
  estimatedImpact: string;
}>;

export type RetailScenarioSimulation = Readonly<{
  name: string;
  assumption: string;
  projectedResult: string;
  tradeoff: string;
}>;

export type RetailCommandLane = Readonly<{
  title: string;
  description: string;
  score: number;
  items: readonly string[];
}>;

export const retailCommandMetrics: readonly RetailCommandMetric[] = [
  {
    label: "Retail health score",
    value: "84/100",
    helper: "Dummy weighted score from sales, stock, margin, and controls.",
    trend: "up",
  },
  {
    label: "Margin protection",
    value: "31.8%",
    helper: "Average gross margin after mock promo and discount effects.",
    trend: "flat",
  },
  {
    label: "Stock risk value",
    value: "Rp 3.420.000",
    helper: "Estimated revenue at risk from low-stock and blocked SKUs.",
    trend: "down",
  },
  {
    label: "Action queue",
    value: "12 tasks",
    helper: "Combined cashier, inventory, supplier, and manager follow-ups.",
    trend: "up",
  },
];

export const retailCommandActions: readonly RetailCommandAction[] = [
  {
    title: "Approve return with no receipt",
    owner: "Store manager",
    priority: "high",
    impact: "Prevents loose refund handling in cashier flow.",
    nextStep: "Require reason note, refund method, and manager PIN later.",
  },
  {
    title: "Reorder fast-moving beverages",
    owner: "Inventory lead",
    priority: "high",
    impact: "Reduces projected stockout for best-selling SKUs.",
    nextStep: "Create purchase suggestion draft from mock reorder list.",
  },
  {
    title: "Review promo margin threshold",
    owner: "Owner",
    priority: "medium",
    impact: "Keeps discount campaigns from killing margin quietly.",
    nextStep: "Set minimum margin rule before promo can be approved.",
  },
  {
    title: "Clean duplicate customer profiles",
    owner: "Cashier supervisor",
    priority: "low",
    impact: "Improves loyalty reporting and member history.",
    nextStep: "Add merge preview mock in customer loyalty dashboard.",
  },
];

export const retailPlanningSignals: readonly RetailPlanningSignal[] = [
  {
    area: "Pricing",
    signal: "Three promoted SKUs are close to minimum target margin.",
    recommendation: "Add margin guard before allowing deeper discounts.",
    estimatedImpact: "+Rp 420.000 protected gross profit / week",
  },
  {
    area: "Inventory",
    signal: "Two fast movers have less than three days of cover.",
    recommendation: "Prioritize purchase order before adding new promo volume.",
    estimatedImpact: "Avoid 18-24 missed basket items",
  },
  {
    area: "Customers",
    signal: "Walk-in ratio is still high compared with member checkout.",
    recommendation: "Prompt phone-number capture after payment success.",
    estimatedImpact: "+7% loyalty enrollment in mock week",
  },
  {
    area: "Branch control",
    signal: "One branch has overstock while another branch is below reorder point.",
    recommendation: "Prepare inter-branch transfer before buying more stock.",
    estimatedImpact: "Reduce idle stock by Rp 1.150.000",
  },
];

export const retailScenarioSimulations: readonly RetailScenarioSimulation[] = [
  {
    name: "10% snack promo",
    assumption: "Apply discount to snack category for three days.",
    projectedResult: "Revenue lift +12%, gross margin down 2.4 points.",
    tradeoff: "Good for basket growth, risky if stock is not replenished.",
  },
  {
    name: "Reorder before weekend",
    assumption: "Buy suggested fast movers before Friday evening.",
    projectedResult: "Stockout risk down from 22% to 6%.",
    tradeoff: "Cash outflow increases before weekend sales arrive.",
  },
  {
    name: "Member capture script",
    assumption: "Cashier asks every walk-in customer for phone number.",
    projectedResult: "New member count +35 in mock week.",
    tradeoff: "Checkout time increases by around 8 seconds per transaction.",
  },
];

export const retailCommandLanes: readonly RetailCommandLane[] = [
  {
    title: "Small retail foundation",
    description: "Must feel fast and simple for one outlet.",
    score: 88,
    items: ["Cashier flow", "Barcode lookup", "Basic loyalty", "Returns desk"],
  },
  {
    title: "Medium retail control",
    description: "Needs owner visibility and staff accountability.",
    score: 81,
    items: ["Receiving", "Stock opname", "Staff shifts", "Forecasting"],
  },
  {
    title: "Large retail expansion",
    description: "Needs branch, channel, and control consistency.",
    score: 74,
    items: ["Multi-location", "Omnichannel", "Transfer planning", "Review queue"],
  },
];

export const retailCommandNextBuildSteps: readonly string[] = [
  "Turn command actions into local interactive checklists.",
  "Add mock transfer planner between branches.",
  "Add margin rule preview inside promotions.",
  "Add customer segment preview inside loyalty dashboard.",
  "Document API contracts after the mock rules feel stable.",
];
