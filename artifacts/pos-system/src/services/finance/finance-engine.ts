export type ProfitInput = {
  revenue: number;
  cogs?: number;
  expenses?: number;
  discounts?: number;
};

export function calculateRevenue(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function calculateCOGS(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function calculateGrossProfit({ revenue, cogs = 0, discounts = 0 }: ProfitInput) {
  return revenue - cogs - discounts;
}

export function calculateNetProfit(input: ProfitInput) {
  return calculateGrossProfit(input) - (input.expenses ?? 0);
}

export function calculateMargin(input: ProfitInput) {
  if (input.revenue === 0) return 0;
  return calculateNetProfit(input) / input.revenue;
}

export function calculateAverageOrderValue(revenue: number, transactionCount: number) {
  if (transactionCount === 0) return 0;
  return revenue / transactionCount;
}
