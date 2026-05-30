"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Eye,
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
import { exportCsv } from "@/features/shared/export";
import { SearchFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, TableToolbar, type DataTableColumn } from "@/features/shared/table";
import type {
  Customer,
  DashboardTone,
  LoyaltyTierName,
  LoyaltyTierSetting,
  Supplier,
} from "@/features/shared/types";

const customerRows: Customer[] = [
  {
    name: "Dina Prasetyo",
    phone: "+62 812 3400 1802",
    email: "dina@example.com",
    address: "Jl. Melati No. 8, Jakarta",
    totalSpending: 8_450_000,
    transactions: 42,
  },
  {
    name: "Raka Wijaya",
    phone: "+62 813 7788 9012",
    email: "raka@example.com",
    address: "Jl. Anggrek No. 12, Tangerang",
    totalSpending: 3_120_000,
    transactions: 19,
  },
  {
    name: "Maya Sari",
    phone: "+62 857 1109 2210",
    email: "maya@example.com",
    address: "Jl. Cemara No. 3, Depok",
    totalSpending: 14_800_000,
    transactions: 71,
  },
];

const supplierRows: Supplier[] = [
  {
    name: "Fresh Farm Supplier",
    phone: "+62 821 4401 9900",
    email: "orders@freshfarm.test",
    address: "Pasar Induk Blok A17",
    totalPurchases: 28_500_000,
    transactions: 26,
  },
  {
    name: "Bean House Roastery",
    phone: "+62 811 9000 2211",
    email: "sales@beanhouse.test",
    address: "Jl. Kopi Raya No. 44",
    totalPurchases: 19_250_000,
    transactions: 14,
  },
  {
    name: "Packaging Nusantara",
    phone: "+62 818 3400 6600",
    email: "hello@packnusantara.test",
    address: "Pergudangan Cikupa Unit 18",
    totalPurchases: 11_900_000,
    transactions: 11,
  },
];

const tierSettings: LoyaltyTierSetting[] = [
  {
    icon: "B",
    tierName: "Bronze",
    calculationPeriod: "Last 12 months",
    minimumSpending: 1_000_000,
    automaticDiscount: "2%",
  },
  {
    icon: "S",
    tierName: "Silver",
    calculationPeriod: "Last 12 months",
    minimumSpending: 5_000_000,
    automaticDiscount: "5%",
  },
  {
    icon: "G",
    tierName: "Gold",
    calculationPeriod: "Last 12 months",
    minimumSpending: 10_000_000,
    automaticDiscount: "8%",
  },
  {
    icon: "P",
    tierName: "Platinum",
    calculationPeriod: "Last 12 months",
    minimumSpending: 20_000_000,
    automaticDiscount: "12%",
  },
];

type PartnerRow = Customer | Supplier;

function getTierTone(tier: LoyaltyTierName): DashboardTone {
  if (tier === "Bronze") return "amber";
  if (tier === "Silver") return "slate";
  if (tier === "Gold") return "green";

  return "blue";
}

function getTotalAmount(row: PartnerRow) {
  return "totalSpending" in row ? row.totalSpending : row.totalPurchases;
}

export function CustomersPartnersDashboard() {
  const [viewMode, setViewMode] = useState("Customers");
  const [search, setSearch] = useState("");

  const activeRows: PartnerRow[] =
    viewMode === "Customers" ? customerRows : supplierRows;

  const filteredRows = useMemo(() => {
    return activeRows.filter((row) =>
      [row.name, row.phone, row.email]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [activeRows, search]);

  const customerSpending = customerRows.reduce(
    (total, row) => total + row.totalSpending,
    0,
  );

  const partnerColumns: DataTableColumn<PartnerRow>[] = [
    { key: "name", header: "Name", cell: (row) => <span className="font-semibold text-neutral-950">{row.name}</span> },
    { key: "phone", header: "Phone", cell: (row) => row.phone },
    { key: "email", header: "Email", cell: (row) => row.email },
    { key: "address", header: "Address", cell: (row) => row.address },
    {
      key: "totalAmount",
      header: viewMode === "Customers" ? "Total Spending" : "Total Purchases",
      cell: (row) => <span className="font-medium">{formatCurrency(getTotalAmount(row))}</span>,
    },
    { key: "transactions", header: "Transactions", cell: (row) => formatNumber(row.transactions) },
    {
      key: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex gap-2">
          <button type="button" className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-semibold hover:bg-neutral-50">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            View Detail
          </button>
          <button type="button" className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-semibold hover:bg-neutral-50">
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
          <button type="button" className="inline-flex h-9 items-center gap-1 rounded-lg border border-rose-200 px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
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
      description="Manage customer profiles, supplier contacts, spending history, loyalty tiers, and import/export workflows."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <StatCard
          label="Total Customers"
          value={formatNumber(customerRows.length)}
          note="Active customer records"
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Total Spending"
          value={formatCurrency(customerSpending)}
          note="Customer lifetime spending"
          icon={WalletCards}
          tone="green"
        />
      </div>

      <DashboardPanel
        title="Loyalty Tier Settings"
        description="Tier icon, name, calculation period, minimum spending, and automatic discount."
      >
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {tierSettings.map((tier) => (
            <article
              key={tier.tierName}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
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
              <h3 className="mt-4 text-lg font-semibold text-neutral-950">
                {tier.tierName}
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Period</dt>
                  <dd className="font-medium text-neutral-800">
                    {tier.calculationPeriod}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Minimum</dt>
                  <dd className="font-medium text-neutral-800">
                    {formatCurrency(tier.minimumSpending)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel>
        <TableToolbar
          filters={
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <DashboardTabs
                value={viewMode}
                options={["Customers", "Suppliers"]}
                onChange={setViewMode}
              />
              <div className="w-full xl:max-w-md">
                <SearchFilter
                  label="Search by name, phone, or email"
                  value={search}
                  placeholder="Search name, phone, or email..."
                  onChange={setSearch}
                />
              </div>
            </div>
          }
          actions={
            <DashboardActions>
              <DashboardActionButton icon={Plus} variant="primary">Add Customer</DashboardActionButton>
              <DashboardActionButton icon={FileUp}>Import Customer File</DashboardActionButton>
              <DashboardActionButton icon={UploadCloud}>Import From Sales Data</DashboardActionButton>
              <DashboardActionButton
                icon={Download}
                onClick={() =>
                  exportCsv({
                    filename: viewMode === "Customers" ? "customers" : "suppliers",
                    rows: filteredRows,
                    columns: [
                      { key: "name", header: "Name", value: (row) => row.name },
                      { key: "phone", header: "Phone", value: (row) => row.phone },
                      { key: "email", header: "Email", value: (row) => row.email },
                      { key: "address", header: "Address", value: (row) => row.address },
                      { key: "amount", header: viewMode === "Customers" ? "Total Spending" : "Total Purchases", value: (row) => getTotalAmount(row) },
                      { key: "transactions", header: "Transactions", value: (row) => row.transactions },
                    ],
                  })
                }
              >
                Export Data
              </DashboardActionButton>
            </DashboardActions>
          }
        />
      </DashboardPanel>

      <DashboardPanel title={viewMode === "Customers" ? "Customer Table" : "Supplier Table"}>
        <DataTable
          columns={partnerColumns}
          data={filteredRows}
          getRowKey={(row) => row.email}
          minWidth={960}
        />
      </DashboardPanel>
    </DashboardShell>
  );
}
