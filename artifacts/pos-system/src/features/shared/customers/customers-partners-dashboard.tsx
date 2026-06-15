"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileUp,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  Users,
  WalletCards,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
  DashboardShell,
  DashboardTabs,
} from "@/features/shared/dashboard";
import { SearchFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, TableToolbar, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";
import {
  customersPartnersApi,
  type CreateContactPayload,
  type CustomerProfileDto,
  type CustomersPartnersCapabilitiesDto,
  type CustomersPartnersExportKind,
  type LoyaltyTierDto,
  type SupplierProfileDto,
} from "@/lib/api/customers-partners-api";

const emptyCapabilities: CustomersPartnersCapabilitiesDto = {
  businessId: "",
  businessMode: "restaurant",
  canView: true,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
  canExport: false,
  canImport: false,
  canSyncFromSales: false,
  isPlannedMode: false,
  plannedReason: null,
};

type ViewMode = "Customers" | "Suppliers";
type PartnerRow = CustomerProfileDto | SupplierProfileDto;

type ContactForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

const emptyForm: ContactForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

function getTierTone(tier: LoyaltyTierDto["tierName"]): DashboardTone {
  if (tier === "Bronze") return "amber";
  if (tier === "Silver") return "slate";
  if (tier === "Gold") return "green";

  return "blue";
}

function isCustomerRow(row: PartnerRow): row is CustomerProfileDto {
  return "totalSpending" in row;
}

function getAssignedCustomerTierTone(row: CustomerProfileDto): DashboardTone {
  if (row.loyaltyTierName === "Bronze") return "amber";
  if (row.loyaltyTierName === "Silver") return "slate";
  if (row.loyaltyTierName === "Gold") return "green";
  if (row.loyaltyTierName === "Platinum") return "blue";

  return "slate";
}

function getAssignedCustomerTierLabel(row: CustomerProfileDto) {
  if (!row.loyaltyTierName) return "Unassigned";

  return `${row.loyaltyTierIcon ? `${row.loyaltyTierIcon} ` : ""}${row.loyaltyTierName}`;
}

function getTotalAmount(row: PartnerRow) {
  return isCustomerRow(row) ? row.totalSpending : row.totalPurchases;
}

function getTransactions(row: PartnerRow) {
  return row.transactions;
}

function getContactPayload(form: ContactForm): CreateContactPayload {
  return {
    name: form.name.trim(),
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    address: form.address.trim() || undefined,
  };
}

function getContactForm(row: PartnerRow): ContactForm {
  return {
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
  };
}

function getRowLabel(row: PartnerRow) {
  return isCustomerRow(row) ? "Customer" : "Supplier";
}

function getExportKind(viewMode: ViewMode): CustomersPartnersExportKind {
  return viewMode === "Customers" ? "customers" : "suppliers";
}

function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function scrollToWorkspaceSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function CustomersPartnersDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("Customers");
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerProfileDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierProfileDto[]>([]);
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTierDto[]>([]);
  const [capabilities, setCapabilities] = useState(emptyCapabilities);
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    totalSuppliers: 0,
    totalCustomerSpending: 0,
    totalSupplierPurchases: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRow, setEditingRow] = useState<PartnerRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeRows: PartnerRow[] = viewMode === "Customers" ? customers : suppliers;
  const canCreateCurrentView = capabilities.canCreate && !capabilities.isPlannedMode;
  const canEditContact = capabilities.canUpdate && !capabilities.isPlannedMode;
  const canUseImport = capabilities.canImport && !capabilities.isPlannedMode;
  const canUseSalesSync = capabilities.canSyncFromSales && !capabilities.isPlannedMode;
  const currentLabel = viewMode === "Customers" ? "Customer" : "Supplier";
  const formLabel = editingRow ? getRowLabel(editingRow) : currentLabel;
  const showContactForm = showCreateForm || editingRow !== null;

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return activeRows;

    return activeRows.filter((row) => {
      const tierText = isCustomerRow(row)
        ? [row.loyaltyTierName ?? "Unassigned", row.loyaltyTierIcon ?? "", `${row.loyaltyDiscount ?? 0}%`].join(" ")
        : "Supplier";

      return [row.name, row.phone ?? "", row.email ?? "", row.address ?? "", tierText]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [activeRows, search]);

  async function loadDashboard() {
    setIsLoading(true);
    setError(null);

    try {
      const capabilityResponse = await customersPartnersApi.getCapabilities();
      setCapabilities(capabilityResponse.data);

      if (!capabilityResponse.data.canView) {
        setCustomers([]);
        setSuppliers([]);
        setLoyaltyTiers([]);
        setSummary({
          totalCustomers: 0,
          totalSuppliers: 0,
          totalCustomerSpending: 0,
          totalSupplierPurchases: 0,
        });
        setError(capabilityResponse.data.plannedReason ?? "Customers & Partners is not available for this mode.");
        return;
      }

      const response = await customersPartnersApi.getDashboard({ search });
      setCapabilities(response.data.capabilities);
      setSummary(response.data.summary);
      setCustomers(response.data.customers);
      setSuppliers(response.data.suppliers);
      setLoyaltyTiers(response.data.loyaltyTiers);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Failed to load customers and partners."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetContactForm() {
    setShowCreateForm(false);
    setEditingRow(null);
    setForm(emptyForm);
  }

  function handleStartCreate() {
    setMessage(null);
    setError(null);
    setEditingRow(null);
    setForm(emptyForm);
    setShowCreateForm(true);
  }

  function handleStartEdit(row: PartnerRow) {
    if (!canEditContact) return;
    setMessage(null);
    setError(null);
    setShowCreateForm(false);
    setEditingRow(row);
    setForm(getContactForm(row));
  }

  async function handleSubmitContact() {
    const payload = getContactPayload(form);
    const isEditing = editingRow !== null;
    setMessage(null);
    setError(null);

    if (!payload.name) {
      setError("Name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        if (isCustomerRow(editingRow)) {
          await customersPartnersApi.updateCustomer(editingRow.id, payload);
        } else {
          await customersPartnersApi.updateSupplier(editingRow.id, payload);
        }
        setMessage(`${formLabel} updated.`);
      } else if (viewMode === "Customers") {
        await customersPartnersApi.createCustomer(payload);
        setMessage(`${currentLabel} created.`);
      } else {
        await customersPartnersApi.createSupplier(payload);
        setMessage(`${currentLabel} created.`);
      }

      resetContactForm();
      await loadDashboard();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, `Failed to save ${formLabel.toLowerCase()}.`));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(row: PartnerRow) {
    if (!capabilities.canDelete) return;
    const confirmed = window.confirm(`Delete ${row.name}? This will hide the record from this dashboard.`);
    if (!confirmed) return;

    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      if (isCustomerRow(row)) {
        await customersPartnersApi.deleteCustomer(row.id);
      } else {
        await customersPartnersApi.deleteSupplier(row.id);
      }
      if (editingRow?.id === row.id) resetContactForm();
      setMessage(`${row.name} deleted.`);
      await loadDashboard();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Failed to delete contact."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExport() {
    if (!capabilities.canExport) return;
    setMessage(null);
    setError(null);
    setIsExporting(true);

    try {
      const kind = getExportKind(viewMode);
      const download = await customersPartnersApi.downloadContactsCsv({
        kind,
        search: search.trim() || undefined,
      });
      downloadBlob(download.blob, download.filename);
      setMessage(`Exported ${download.rowCount ?? filteredRows.length} ${kind}.`);
    } catch (exportError) {
      setError(getApiErrorMessage(exportError, "Failed to export contacts."));
    } finally {
      setIsExporting(false);
    }
  }

  const partnerColumns: DataTableColumn<PartnerRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => <span className="font-semibold text-neutral-950">{row.name}</span>,
    },
    { key: "phone", header: "Phone", cell: (row) => row.phone ?? "-" },
    { key: "email", header: "Email", cell: (row) => row.email ?? "-" },
    { key: "address", header: "Address", cell: (row) => row.address ?? "-" },
    {
      key: "tier",
      header: viewMode === "Customers" ? "Loyalty Tier" : "Type",
      cell: (row) => {
        if (!isCustomerRow(row)) {
          return <StatusPill tone="slate">Supplier</StatusPill>;
        }

        return (
          <div className="space-y-1">
            <StatusPill tone={getAssignedCustomerTierTone(row)}>{getAssignedCustomerTierLabel(row)}</StatusPill>
            <div className="text-xs text-neutral-500">
              {row.loyaltyTierName ? `${row.loyaltyDiscount ?? 0}% discount` : "Run tier assignment"}
            </div>
          </div>
        );
      },
    },
    {
      key: "totalAmount",
      header: viewMode === "Customers" ? "Total Spending" : "Total Purchases",
      cell: (row) => <span className="font-medium">{formatCurrency(getTotalAmount(row))}</span>,
    },
    { key: "transactions", header: "Transactions", cell: (row) => formatNumber(getTransactions(row)) },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!capabilities.canUpdate || isSubmitting}
            title={capabilities.canUpdate ? "Edit contact" : "Edit requires management access"}
            onClick={() => handleStartEdit(row)}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-semibold hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            disabled={!capabilities.canDelete || isSubmitting}
            title={capabilities.canDelete ? "Delete contact" : "Delete requires management access"}
            onClick={() => void handleDelete(row)}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-rose-200 px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      title="Customers & Partners"
      description="Manage backend-backed customer profiles, supplier contacts, spending history, assigned loyalty tiers, and guarded import/export workflows."
    >
      {capabilities.isPlannedMode ? (
        <DashboardPanel title="Planned Mode" description={capabilities.plannedReason ?? "This dashboard is not available for this mode yet."}>
          <div className="p-4 text-sm text-neutral-600">
            Service/custom-business support is intentionally guarded until the operational backend is ready.
          </div>
        </DashboardPanel>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="Total Customers"
          value={isLoading ? "Loading..." : formatNumber(summary.totalCustomers)}
          note="Backend customer records"
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Customer Spending"
          value={isLoading ? "Loading..." : formatCurrency(summary.totalCustomerSpending)}
          note="Lifetime customer spending"
          icon={WalletCards}
          tone="green"
        />
        <StatCard
          label="Total Suppliers"
          value={isLoading ? "Loading..." : formatNumber(summary.totalSuppliers)}
          note="Backend supplier records"
          icon={Users}
          tone="amber"
        />
      </div>

      <DashboardPanel
        title="Loyalty Tier Settings"
        description="Backend-seeded tier icon, name, calculation period, minimum spending, and automatic discount. Use the loyalty workflow above to edit and assign tiers."
      >
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {loyaltyTiers.map((tier) => (
            <article key={tier.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-neutral-800 ring-1 ring-neutral-200"
                  aria-hidden="true"
                >
                  {tier.icon}
                </div>
                <StatusPill tone={getTierTone(tier.tierName)}>
                  {tier.automaticDiscount} discount
                </StatusPill>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-neutral-950">{tier.tierName}</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Period</dt>
                  <dd className="font-medium text-neutral-800">{tier.calculationPeriod}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Minimum</dt>
                  <dd className="font-medium text-neutral-800">{formatCurrency(tier.minimumSpending)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </DashboardPanel>

      {showContactForm ? (
        <DashboardPanel
          title={editingRow ? `Edit ${formLabel}` : `Add ${currentLabel}`}
          description={editingRow ? `Update the selected ${formLabel.toLowerCase()} record for this business.` : `Create a backend-scoped ${currentLabel.toLowerCase()} record for this business.`}
        >
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-neutral-700">
              Name
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm"
                placeholder={`${formLabel} name`}
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-neutral-700">
              Phone
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm"
                placeholder="Phone number"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-neutral-700">
              Email
              <input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm"
                placeholder="email@example.com"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-neutral-700">
              Address
              <input
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm"
                placeholder="Address"
              />
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-100 p-4">
            <button
              type="button"
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              onClick={resetContactForm}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void handleSubmitContact()}
            >
              {isSubmitting ? "Saving..." : editingRow ? `Update ${formLabel}` : `Create ${currentLabel}`}
            </button>
          </div>
        </DashboardPanel>
      ) : null}

      <DashboardPanel>
        <TableToolbar
          filters={
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <DashboardTabs
                value={viewMode}
                options={["Customers", "Suppliers"]}
                onChange={(value) => setViewMode(value as ViewMode)}
              />
              <div className="w-full xl:max-w-md">
                <SearchFilter
                  label="Search by name, phone, email, address, or tier"
                  value={search}
                  placeholder="Search name, phone, email, address, or tier..."
                  onChange={setSearch}
                />
              </div>
            </div>
          }
          actions={
            <DashboardActions>
              <DashboardActionButton
                icon={Plus}
                variant="primary"
                disabled={!canCreateCurrentView || isSubmitting}
                title={canCreateCurrentView ? `Add ${currentLabel}` : "Create requires management access"}
                onClick={handleStartCreate}
              >
                Add {currentLabel}
              </DashboardActionButton>
              <DashboardActionButton
                icon={FileUp}
                disabled={!canUseImport}
                title={canUseImport ? "Open CSV import workflow" : "Import requires management access"}
                onClick={() => scrollToWorkspaceSection("customers-csv-import")}
              >
                Import CSV
              </DashboardActionButton>
              <DashboardActionButton
                icon={UploadCloud}
                disabled={!canUseSalesSync}
                title={canUseSalesSync ? "Open paid invoice sales sync workflow" : "Sales sync requires management access"}
                onClick={() => scrollToWorkspaceSection("customers-sales-sync")}
              >
                Sync Sales
              </DashboardActionButton>
              <DashboardActionButton
                icon={Download}
                disabled={!capabilities.canExport || isExporting || filteredRows.length === 0}
                title={capabilities.canExport ? "Export matching backend records" : "Export is not available"}
                onClick={() => void handleExport()}
              >
                {isExporting ? "Exporting..." : "Export Data"}
              </DashboardActionButton>
            </DashboardActions>
          }
        />
      </DashboardPanel>

      <DashboardPanel title={viewMode === "Customers" ? "Customer Table" : "Supplier Table"}>
        <DataTable
          columns={partnerColumns}
          data={filteredRows}
          getRowKey={(row) => row.id}
          minWidth={1080}
        />
        {isLoading ? <div className="p-4 text-sm text-neutral-500">Loading records...</div> : null}
        {!isLoading && filteredRows.length === 0 ? (
          <div className="p-4 text-sm text-neutral-500">
            No {viewMode.toLowerCase()} found. Add a backend record, import CSV, sync paid invoices, or assign tiers to grow the directory.
          </div>
        ) : null}
      </DashboardPanel>
    </DashboardShell>
  );
}
