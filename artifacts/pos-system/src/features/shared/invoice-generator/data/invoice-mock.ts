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
      name: "POS System V3 Business",
      email: "billing@example.com",
      address: "Jl. Sudirman No. 10, Jakarta",
      phone: "+62 812 0000 2026",
    },
    customer: {
      name: "Customer Name",
      address: "Customer billing address",
      phone: "+62 812 3456 7890",
    },
    billing: {
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: getDateInputValue(),
      dueDate: getDateInputValue(14),
    },
    items: [
      {
        id: "item-1",
        description: "Product / Service",
        quantity: 1,
        unitPrice: 250_000,
      },
    ],
    paymentStatus: "Pending",
    discount: {
      mode: "percentage",
      value: 0,
    },
    notes: "Thank you for your business.",
  };
}
