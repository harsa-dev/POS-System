"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Mail, MapPin, Phone, Truck, UserRound, WalletCards } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardActionButton, DashboardActions, DashboardPanel } from "@/features/shared/dashboard";
import { SearchFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import {
  customersPartnersApi,
  type CustomerDetailDto,
  type CustomerProfileDto,
  type SupplierProfileDto,
} from "@/lib/api/customers-partners-api";

export const CUSTOMERS_PARTNERS_VIEW_DETAIL_EVENT = "customers-partners:view-detail";

type DetailKind = "customers" | "suppliers";
type DetailRow = CustomerProfileDto | SupplierProfileDto;
type DetailContact = CustomerDetailDto | SupplierProfileDto;

type CustomersPartnersViewDetailEvent = CustomEvent<{
  kind: DetailKind;
  id: string;
}>;

type CustomersPartnersDetailPanelProps = {
  reloadSignal?: number;
};

function isCustomer(row: DetailRow | DetailContact): row is CustomerProfileDto | CustomerDetailDto {
  return "totalSpending" in row;
}

function getTotalValue(row: DetailRow | DetailContact) {
  return isCustomer(row) ? row.totalSpending : row.totalPurchases;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function fetchContactDetail(kind: DetailKind, id: string) {
  const response = kind === "customers"
    ? await customersPartnersApi.getCustomerDetail(id)
    : await customersPartnersApi.getSupplierDetail(id);

  return response.data.contact;
}

export function CustomersPartnersDetailPanel({ reloadSignal = 0 }: CustomersPartnersDetailPanelProps) {
  const [kind, setKind] = useState<DetailKind>("customers");
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerProfileDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierProfileDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DetailContact | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDetails() {
    setIsLoadingList(true);
    setError(null);

    try {
      const response = await customersPartnersApi.getDashboard();
      setCustomers(response.data.customers);
      setSuppliers(response.data.suppliers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load contact details.");
    } finally {
      setIsLoadingList(false);
    }
  }

  useEffect(() => {
    void loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadSignal]);

  useEffect(() => {
    function handleViewDetail(event: Event) {
      const detail = (event as CustomersPartnersViewDetailEvent).detail;
      if (!detail?.id || !detail.kind) return;
      setKind(detail.kind);
      setSelectedId(detail.id);
      document.getElementById("customers-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.addEventListener(CUSTOMERS_PARTNERS_VIEW_DETAIL_EVENT, handleViewDetail);
    return () => window.removeEventListener(CUSTOMERS_PARTNERS_VIEW_DETAIL_EVENT, handleViewDetail);
  }, []);

  const activeRows: DetailRow[] = kind === "customers" ? customers : suppliers;
  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return activeRows;

    return activeRows.filter((row) =>
      [row.name, row.phone ?? "", row.email ?? "", row.address ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [activeRows, search]);

  const selectedListRow = useMemo(() => {
    if (selectedId) return filteredRows.find((row) => row.id === selectedId) ?? null;
    return filteredRows[0] ?? null;
  }, [filteredRows, selectedId]);

  useEffect(() => {
    if (!selectedListRow && selectedId) {
      setSelectedId(null);
      setSelectedDetail(null);
      return;
    }

    if (!selectedId && selectedListRow?.id) setSelectedId(selectedListRow.id);
  }, [selectedId, selectedListRow]);

  useEffect(() => {
    if (!selectedId) return;

    let isMounted = true;
    setIsLoadingDetail(true);
    setError(null);

    fetchContactDetail(kind, selectedId)
      .then((contact) => {
        if (isMounted) setSelectedDetail(contact);
      })
      .catch((detailError) => {
        if (!isMounted) return;
        setSelectedDetail(null);
        setError(detailError instanceof Error ? detailError.message : "Failed to load contact detail.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [kind, selectedId, reloadSignal]);

  const selectedRow = selectedDetail ?? selectedListRow;
  const KindIcon = kind === "customers" ? UserRound : Truck;
  const valueLabel = kind === "customers" ? "Lifetime Spending" : "Lifetime Purchases";
  const customerDetail = selectedDetail && isCustomer(selectedDetail) ? selectedDetail : null;

  return (
    <DashboardPanel
      title="Contact Detail"
      description="Inspect one backend contact record without leaving the Customers & Partners workflow. Row-level View actions open this panel."
    >
      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <DashboardActions>
            <DashboardActionButton
              icon={UserRound}
              variant={kind === "customers" ? "primary" : "secondary"}
              onClick={() => {
                setKind("customers");
                setSelectedId(null);
                setSelectedDetail(null);
              }}
            >
              Customers
            </DashboardActionButton>
            <DashboardActionButton
              icon={Truck}
              variant={kind === "suppliers" ? "primary" : "secondary"}
              onClick={() => {
                setKind("suppliers");
                setSelectedId(null);
                setSelectedDetail(null);
              }}
            >
              Suppliers
            </DashboardActionButton>
          </DashboardActions>

          <div className="w-full xl:max-w-md">
            <SearchFilter
              label="Find a contact detail"
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

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-950">
                  {kind === "customers" ? "Customer Records" : "Supplier Records"}
                </p>
                <p className="text-xs text-neutral-500">
                  {isLoadingList ? "Loading..." : `${formatNumber(filteredRows.length)} visible`}
                </p>
              </div>
              <StatusPill tone="slate">Backend</StatusPill>
            </div>

            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedId === row.id
                      ? "border-neutral-900 bg-white shadow-sm"
                      : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <span className="block font-semibold text-neutral-950">{row.name}</span>
                  <span className="mt-1 block truncate text-xs text-neutral-500">
                    {row.phone ?? row.email ?? row.address ?? "No contact detail"}
                  </span>
                </button>
              ))}

              {!isLoadingList && filteredRows.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
                  No matching {kind} found.
                </div>
              ) : null}
            </div>
          </div>

          {selectedRow ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                      <KindIcon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-neutral-950">{selectedRow.name}</h3>
                        <StatusPill tone={selectedRow.isActive ? "green" : "rose"}>
                          {selectedRow.isActive ? "Active" : "Inactive"}
                        </StatusPill>
                        {isLoadingDetail ? <StatusPill tone="slate">Loading detail</StatusPill> : null}
                      </div>
                      <p className="mt-1 text-sm text-neutral-500">Backend ID: {selectedRow.id}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{valueLabel}</p>
                    <p className="text-2xl font-semibold text-neutral-950">
                      {formatCurrency(getTotalValue(selectedRow))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <StatCard
                  label="Transactions"
                  value={formatNumber(selectedRow.transactions)}
                  note="Backend activity count"
                  icon={WalletCards}
                  tone="blue"
                />
                <StatCard
                  label="Created"
                  value={formatDateTime(selectedRow.createdAt)}
                  note="Record creation time"
                  icon={CalendarClock}
                  tone="slate"
                />
                <StatCard
                  label="Updated"
                  value={formatDateTime(selectedRow.updatedAt)}
                  note="Last backend update"
                  icon={CalendarClock}
                  tone="green"
                />
              </div>

              {customerDetail ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <StatCard
                    label="Sales Sources"
                    value={formatNumber(customerDetail.salesSourceCount ?? 0)}
                    note="Paid invoice records synced"
                    icon={WalletCards}
                    tone="green"
                  />
                  <StatCard
                    label="Last Sales Sync"
                    value={formatDateTime(customerDetail.lastSalesSyncedAt)}
                    note="Customer profile enrichment"
                    icon={CalendarClock}
                    tone="blue"
                  />
                  <StatCard
                    label="Identity Key"
                    value={customerDetail.identityKey ?? "Manual"}
                    note="Sales sync match key"
                    icon={UserRound}
                    tone="slate"
                  />
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <Phone className="h-5 w-5 text-neutral-500" aria-hidden="true" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Phone</p>
                  <p className="mt-1 text-sm font-medium text-neutral-900">{selectedRow.phone ?? "Not provided"}</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <Mail className="h-5 w-5 text-neutral-500" aria-hidden="true" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Email</p>
                  <p className="mt-1 break-words text-sm font-medium text-neutral-900">
                    {selectedRow.email ?? "Not provided"}
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <MapPin className="h-5 w-5 text-neutral-500" aria-hidden="true" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Address</p>
                  <p className="mt-1 text-sm font-medium text-neutral-900">{selectedRow.address ?? "Not provided"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
              {isLoadingList ? "Loading contact details..." : "Select a record to inspect details."}
            </div>
          )}
        </div>
      </div>
    </DashboardPanel>
  );
}
