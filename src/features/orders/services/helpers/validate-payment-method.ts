import { BadRequestError } from "@/lib/errors";

type ValidatePaymentMethodParams = {
  paymentMethod: string;

  paymentEnabledMap: Record<
    string,
    boolean
  >;
};

export function validatePaymentMethod({
  paymentMethod,
  paymentEnabledMap,
}: ValidatePaymentMethodParams) {
  if (!paymentMethod) {
    throw new BadRequestError(
      "Payment method is required",
    );
  }

  if (
    !paymentEnabledMap[
      paymentMethod
    ]
  ) {
    throw new BadRequestError(
      `${paymentMethod} payment is disabled`,
    );
  }
}