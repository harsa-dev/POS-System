"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Eye } from "lucide-react";

import { StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { SearchFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import {
  CUSTOMERS_PARTNERS_VIEW_DETAIL_EVENT,
} from "./customers-partners-detail-panel";
import {
  customersPartnersApi,
  type CustomerProfileDto,
} from "@/lib/api/customers-partners-api";

type CustomersPartnersTierDirectoryPanelProps = {
  reloadSignal?: number;
};

function getTierLabel(customer: CustomerProfileDto) {
  if (!customer.loyaltyTierName) return "Unassigned";
  return [customer.loyaltyTierIcon, customer.loyaltyTierName].filter(Boolean).join(" ");
}

function getTierTone(customer: CustomerProfileDto) {
  return customer.loyaltyTierName ? "amber" : "slate";
}

function getTierAssignedAt(customer: CustomerProfileDto) {
  if (!customer.tierAssignedAt) return "Not assigned";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(customer.tierAssignedAt));
}

function openCustomerDetail(id: string) {
  window.dispatchEvent(
    new CustomEvent(CUSTOMERS_PARTNERS_VIEW_DETAIL_EVENT, {
      detail: { kind: "customers", id },
    }),
  );
}

export function CustomersPartnersTierDirectoryPanel({ reloadSignal = 0 }: CustomersPartnersTierDirectoryPanelProps) {
  const [customers, setCustomers] = useState<CustomerProfileDto[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCustomers() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await customersPartnersApi.getDashboard();
      setCustomers(response.data.customers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load customer tiers.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadSignal]);

  const filteredCustomers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.phone ?? "",
        customer.email ?? "",
        customer.loyaltyTierName ?? "unassigned",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [customers, search]);

  const tierSummary = useMemo(() => {
    const assigned = customers.filter((customer) => Boolean(customer.loyaltyTierName)).length;
    const unassigned = customers.length - assigned;
    const byTier = customers.reduce<Record<string, number>>((acc, customer) => {
      const key = customer.loyaltyTierName ?? "Unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return { assigned, unassigned, byTier };
  }, [customers]);

  const columns: DataTableColumn<CustomerProfileDto>[] = [
    {
      key: "customer",
      header: "Customer",
      cell: (customer) => (
        <div>
          <p className="font-semibold text-neutral-950">{customer.name}</p>
          <p className="text-xs text-neutral-500">{customer.phone ?? customer.email ?? "No contact"}</p>
        </div>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      cell: (customer) => (
        <StatusPill tone={getTierTone(customer)}>
          {getTierLabel(customer)}
        </StatusPill>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      cell: (customer) => customer.loyaltyDiscount ?? "-",
    },
    {
      key: "spending",
      header: "Spending",
      cell: (customer) => formatCurrency(customer.totalSpending),
    },
    {
      key: "transactions",
      header: "Transactions",
      cell: (customer) => formatNumber(customer.transactions),
    },
    {
      key: "assignedAt",
      header: "Assigned At",
      cell: (customer) => getTierAssignedAt(customer),
    },
    {
      key: "actions",
      header: "Detail",
      cell: (customer) => (
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-semibold hover:bg-neutral-50"
          onClick={() => openCustomerDetail(customer.id)}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          View
        </button>
      ),
    },
  ];

  return (
    <DashboardPanel
      title="Customer Tier Directory"
      description="Review the loyalty tier currently stored on each customer profile after tier assignment runs. This reads backend customer records, not a local tier guess."
    >
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
              <Award className="h-4 w-4 text-neutral-500" aria-hidden="true" />
              Assigned Customers
            </div>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">{formatNumber(tierSummary.assigned)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-950">Unassigned Customers</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">{formatNumber(tierSummary.unassigned)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-950">Tier Spread</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(tierSummary.byTier).map(([tier, count]) => (
                <StatusPill key={tier} tone={tier === "Unassigned" ? "slate" : "amber"}>
                  {tier}: {formatNumber(count)}
                </StatusPill>
              ))}
              {customers.length === 0 ? <StatusPill tone="slate">No customers</StatusPill> : null}
            </div>
          </div>
        </div>

        <SearchFilter
          label="Find customer tier"
          value={search}
          placeholder="Search customer, phone, email, or tier..."
          onChange={setSearch}
        />

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <DataTable columns={columns} data={filteredCustomers} getRowKey={(customer) => customer.id} minWidth={1040} />
        {isLoading ? <div className="text-sm text-neutral-500">Loading customer tiers...</div> : null}
        {!isLoading && filteredCustomers.length === 0 ? (
          <div className="text-sm text-neutral-500">No customer tiers match the current search.</div>
        ) : null}
      </div>
    </DashboardPanel>
  );
}
