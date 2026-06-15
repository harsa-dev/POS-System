"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Truck, UserRound } from "lucide-react";

import { StatusPill } from "@/features/shared/cards";
import { DashboardActionButton, DashboardActions, DashboardPanel, DashboardTabs } from "@/features/shared/dashboard";
import { SearchFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import {
  CUSTOMERS_PARTNERS_VIEW_DETAIL_EVENT,
} from "./customers-partners-detail-panel";
import {
  customersPartnersApi,
  type CustomerProfileDto,
  type SupplierProfileDto,
} from "@/lib/api/customers-partners-api";

type DetailKind = "customers" | "suppliers";
type DetailRow = CustomerProfileDto | SupplierProfileDto;

type CustomersPartnersDetailTableProps = {
  reloadSignal?: number;
};

function isCustomer(row: DetailRow): row is CustomerProfileDto {
  return "totalSpending" in row;
}

function getRowValue(row: DetailRow) {
  return isCustomer(row) ? row.totalSpending : row.totalPurchases;
}

function openDetail(kind: DetailKind, id: string) {
  window.dispatchEvent(
    new CustomEvent(CUSTOMERS_PARTNERS_VIEW_DETAIL_EVENT, {
      detail: { kind, id },
    }),
  );
}

export function CustomersPartnersDetailTable({ reloadSignal = 0 }: CustomersPartnersDetailTableProps) {
  const [kind, setKind] = useState<DetailKind>("customers");
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerProfileDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierProfileDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRows() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await customersPartnersApi.getDashboard();
      setCustomers(response.data.customers);
      setSuppliers(response.data.suppliers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load detail table.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadSignal]);

  const rows: DetailRow[] = kind === "customers" ? customers : suppliers;
  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) =>
      [row.name, row.phone ?? "", row.email ?? "", row.address ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [rows, search]);

  const columns: DataTableColumn<DetailRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => <span className="font-semibold text-neutral-950">{row.name}</span>,
    },
    {
      key: "contact",
      header: "Contact",
      cell: (row) => row.phone ?? row.email ?? row.address ?? "-",
    },
    {
      key: "value",
      header: kind === "customers" ? "Spending" : "Purchases",
      cell: (row) => formatCurrency(getRowValue(row)),
    },
    {
      key: "transactions",
      header: "Transactions",
      cell: (row) => formatNumber(row.transactions),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusPill tone={row.isActive ? "green" : "rose"}>
          {row.isActive ? "Active" : "Inactive"}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      header: "Detail",
      cell: (row) => (
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-semibold hover:bg-neutral-50"
          onClick={() => openDetail(kind, row.id)}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          View
        </button>
      ),
    },
  ];

  return (
    <DashboardPanel
      title="Detail Lookup Table"
      description="Open one backend contact record in the detail panel without loading the full directory into the inspector."
    >
      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <DashboardActions>
            <DashboardActionButton
              icon={UserRound}
              variant={kind === "customers" ? "primary" : "secondary"}
              onClick={() => setKind("customers")}
            >
              Customers
            </DashboardActionButton>
            <DashboardActionButton
              icon={Truck}
              variant={kind === "suppliers" ? "primary" : "secondary"}
              onClick={() => setKind("suppliers")}
            >
              Suppliers
            </DashboardActionButton>
          </DashboardActions>

          <div className="w-full xl:max-w-md">
            <SearchFilter
              label="Find record"
              value={search}
              placeholder="Search name, phone, email, or address..."
              onChange={setSearch}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <DataTable columns={columns} data={filteredRows} getRowKey={(row) => row.id} minWidth={860} />
        {isLoading ? <div className="text-sm text-neutral-500">Loading records...</div> : null}
        {!isLoading && filteredRows.length === 0 ? (
          <div className="text-sm text-neutral-500">No matching {kind} found.</div>
        ) : null}
      </div>
    </DashboardPanel>
  );
}
