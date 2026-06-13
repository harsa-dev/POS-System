import {
  calculateBillableCost,
  calculateCollectionRate,
  calculateCostBase,
  calculateGrossProfit,
  calculateQuoteSubtotal,
  calculateQuoteTax,
  calculateQuoteTotal,
  formatServiceMoney,
  getInvoiceStatusLabel,
  getQuoteStatusLabel,
  getServicePriorityLabel,
  getServiceStatusLabel,
} from "./service-business-workspace-domain";
import type { ServiceBusinessJob } from "./service-business-workspace-types";

export type ServiceBusinessJobViewModel = {
  id: string;
  requestCode: string;
  title: string;
  customerLabel: string;
  serviceCategory: string;
  assignedTo: string;
  dueDate: string;
  statusLabel: string;
  priorityLabel: string;
  quoteLabel: string;
  invoiceLabel: string;
  costBaseLabel: string;
  billableCostLabel: string;
  quoteSubtotalLabel: string;
  quoteTaxLabel: string;
  quoteTotalLabel: string;
  grossProfitLabel: string;
  collectionRate: number;
  collectionLabel: string;
};

export function mapServiceJobToViewModel(
  job: ServiceBusinessJob,
): ServiceBusinessJobViewModel {
  const costBase = calculateCostBase(job.costLines);
  const billableCost = calculateBillableCost(job.costLines);
  const quoteSubtotal = calculateQuoteSubtotal(job);
  const quoteTax = calculateQuoteTax(job);
  const quoteTotal = calculateQuoteTotal(job);
  const grossProfit = calculateGrossProfit(job);
  const collectionRate = calculateCollectionRate(job.invoice, quoteTotal);

  return {
    id: job.id,
    requestCode: job.requestCode,
    title: job.title,
    customerLabel: `${job.customerName} · ${job.customerSegment}`,
    serviceCategory: job.serviceCategory,
    assignedTo: job.assignedTo,
    dueDate: job.dueDate,
    statusLabel: getServiceStatusLabel(job.status),
    priorityLabel: getServicePriorityLabel(job.priority),
    quoteLabel: `${job.quote.code} · ${getQuoteStatusLabel(job.quote.status)}`,
    invoiceLabel: `${job.invoice.code} · ${getInvoiceStatusLabel(job.invoice.status)}`,
    costBaseLabel: formatServiceMoney(costBase),
    billableCostLabel: formatServiceMoney(billableCost),
    quoteSubtotalLabel: formatServiceMoney(quoteSubtotal),
    quoteTaxLabel: formatServiceMoney(quoteTax),
    quoteTotalLabel: formatServiceMoney(quoteTotal),
    grossProfitLabel: formatServiceMoney(grossProfit),
    collectionRate,
    collectionLabel: `${collectionRate}% collected`,
  };
}
