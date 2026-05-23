type CalculateOrderTotalParams = {
  subtotal: number;

  taxRate: number;

  serviceRate: number;
};

export function calculateOrderTotal({
  subtotal,
  taxRate,
  serviceRate,
}: CalculateOrderTotalParams) {
  const taxAmount =
    Math.round(
      subtotal *
        (taxRate / 100),
    );

  const serviceAmount =
    Math.round(
      subtotal *
        (serviceRate / 100),
    );

  const total =
    subtotal +
    taxAmount +
    serviceAmount;

  return {
    taxAmount,
    serviceAmount,
    total,
  };
}