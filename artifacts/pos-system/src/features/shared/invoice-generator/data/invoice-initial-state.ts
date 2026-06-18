import { generateInvoiceNumber } from "../services/invoice-number";
import type { InvoiceDraft } from "@/features/shared/types";

function getDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function createInitialInvoice(): InvoiceDraft {
  return {
    business: {
      name: "",
      email: "",
      address: "",
      phone: "",
    },
    customer: {
      name: "",
      address: "",
      phone: "",
    },
    billing: {
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: getDateInputValue(),
      dueDate: getDateInputValue(14),
    },
    items: [
      {
        id: "item-1",
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ],
    paymentStatus: "Pending",
    discount: {
      mode: "percentage",
      value: 0,
    },
    notes: "",
  };
}
