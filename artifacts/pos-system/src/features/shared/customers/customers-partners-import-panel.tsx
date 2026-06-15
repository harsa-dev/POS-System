"use client";

import { useState } from "react";
import { FileSpreadsheet, RefreshCw, UploadCloud } from "lucide-react";

import { DashboardActionButton, DashboardPanel } from "@/features/shared/dashboard";
import { formatNumber } from "@/features/shared/format";
import {
  customersPartnersApi,
  type CustomersPartnersImportKind,
  type CustomersPartnersImportPreviewDto,
  type CustomersPartnersImportResultDto,
} from "@/lib/api/customers-partners-api";

type CustomersPartnersImportPanelProps = {
  onImported?: (result: CustomersPartnersImportResultDto) => void;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function sampleCsv(kind: CustomersPartnersImportKind) {
  const name = kind === "customers" ? "Customer Name" : "Supplier Name";
  return `${name},Phone,Email,Address\nAcme Example,08123456789,acme@example.com,Main Street 1`;
}

export function CustomersPartnersImportPanel({ onImported }: CustomersPartnersImportPanelProps) {
  const [kind, setKind] = useState<CustomersPartnersImportKind>("customers");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<CustomersPartnersImportPreviewDto | null>(null);
  const [result, setResult] = useState<CustomersPartnersImportResultDto | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function readImportFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setPreview(null);
    setResult(null);
    setMessage(null);
    setError(null);

    try {
      const text = await file.text();
      setCsvText(text);
    } catch (readError) {
      setCsvText("");
      setError(getApiErrorMessage(readError, "Failed to read CSV file."));
    }
  }

  async function handlePreview() {
    setIsPreviewing(true);
    setError(null);
    setMessage(null);
    setResult(null);

    try {
      const response = await customersPartnersApi.previewImport({ kind, csvText });
      setPreview(response.data);
      setMessage(`Preview ready: ${formatNumber(response.data.readyCount)} rows can be imported.`);
    } catch (previewError) {
      setPreview(null);
      setError(getApiErrorMessage(previewError, "Failed to preview CSV import."));
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleCommit() {
    setIsCommitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await customersPartnersApi.commitImport({ kind, csvText });
      setResult(response.data);
      setPreview(null);
      setMessage(
        `Import completed: ${formatNumber(response.data.created)} created, ${formatNumber(response.data.updated)} updated, ${formatNumber(response.data.skipped)} skipped.`,
      );
      onImported?.(response.data);
    } catch (commitError) {
      setError(getApiErrorMessage(commitError, "Failed to commit CSV import."));
    } finally {
      setIsCommitting(false);
    }
  }

  const hasCsvText = csvText.trim().length > 0;
  const canCommit = Boolean(preview && preview.readyCount > 0 && !isPreviewing && !isCommitting);
  const isBusy = isPreviewing || isCommitting;

  return (
    <DashboardPanel
      title="CSV Import"
      description="Preview and import customer or supplier contacts with backend validation. Browser reads the file; API decides what is allowed. As it should."
    >
      <div className="space-y-4 p-4">
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
            {message}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            Import Target
            <select
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={kind}
              disabled={isBusy}
              onChange={(event) => {
                setKind(event.target.value as CustomersPartnersImportKind);
                setPreview(null);
                setResult(null);
                setMessage(null);
              }}
            >
              <option value="customers">Customers</option>
              <option value="suppliers">Suppliers</option>
            </select>
          </label>

          <label className="space-y-1 text-sm font-medium text-neutral-700">
            CSV File
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={isBusy}
              className="w-full rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-2 text-sm"
              onChange={(event) => void readImportFile(event.target.files?.[0])}
            />
          </label>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
          <div className="flex items-start gap-2">
            <FileSpreadsheet className="mt-0.5 h-4 w-4 text-neutral-500" />
            <div>
              <p className="font-semibold text-neutral-900">Expected columns</p>
              <p className="mt-1">Name, Phone, Email, Address. Name is required. Email must be valid when provided.</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-white p-2 text-xs text-neutral-600">{sampleCsv(kind)}</pre>
              {fileName ? <p className="mt-2 text-xs text-neutral-500">Loaded file: {fileName}</p> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <DashboardActionButton
            icon={RefreshCw}
            disabled={!hasCsvText || isBusy}
            onClick={() => void handlePreview()}
          >
            {isPreviewing ? "Previewing..." : "Preview Import"}
          </DashboardActionButton>
          <DashboardActionButton
            icon={UploadCloud}
            variant="primary"
            disabled={!canCommit}
            title={canCommit ? "Commit valid rows" : "Preview a CSV with valid rows first"}
            onClick={() => void handleCommit()}
          >
            {isCommitting ? "Importing..." : "Commit Import"}
          </DashboardActionButton>
        </div>

        {preview ? (
          <div className="rounded-lg border border-neutral-200">
            <div className="grid gap-2 border-b border-neutral-100 p-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Rows</p>
                <p className="font-semibold text-neutral-950">{formatNumber(preview.rowCount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Ready</p>
                <p className="font-semibold text-neutral-950">{formatNumber(preview.readyCount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Errors</p>
                <p className="font-semibold text-neutral-950">{formatNumber(preview.errorCount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Duplicates</p>
                <p className="font-semibold text-neutral-950">{formatNumber(preview.duplicateCount)}</p>
              </div>
            </div>
            <div className="max-h-72 divide-y divide-neutral-100 overflow-y-auto">
              {preview.rows.slice(0, 12).map((row) => (
                <article key={`${row.rowNumber}-${row.name}`} className="p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-950">Row {row.rowNumber}: {row.name || "Unnamed"}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {row.phone ?? "No phone"} · {row.email ?? "No email"} · {row.address ?? "No address"}
                      </p>
                      {row.errors.length > 0 ? (
                        <p className="mt-1 text-xs font-medium text-rose-600">{row.errors.join(" ")}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold uppercase text-neutral-600">
                      {row.status}
                    </span>
                  </div>
                </article>
              ))}
              {preview.rows.length > 12 ? (
                <div className="p-3 text-xs text-neutral-500">
                  Showing first 12 rows of {formatNumber(preview.rows.length)}. Backend still validates all rows, because unlike humans, it can count past twelve.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
            <p className="font-semibold text-neutral-950">Last import result</p>
            <p className="mt-1 text-neutral-600">
              {formatNumber(result.created)} created, {formatNumber(result.updated)} updated, {formatNumber(result.skipped)} skipped at {new Date(result.importedAt).toLocaleString()}.
            </p>
          </div>
        ) : null}
      </div>
    </DashboardPanel>
  );
}
