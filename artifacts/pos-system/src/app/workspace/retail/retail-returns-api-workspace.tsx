import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";

import {
  retailPersistReturn,
  retailPreviewReturn,
  type RetailReturnInput,
  type RetailReturnPreview,
  type RetailReturnResult,
} from "@workspace/api-client-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRetailCurrency } from "@/features/retail/core-system";

type RetailReturnReason = "damaged" | "wrong-item" | "customer-changed-mind" | "expired" | "other";

type ApiProduct = {
  id: string;
  sku: string;
  name: string;
  price: number;
  currentStock: number;
  shelfLocation: string;
};

type ApiState = "loading" | "api" | "mock-fallback";

const returnReasons: { value: RetailReturnReason; label: string }[] = [
  { value: "damaged", label: "Damaged item" },
  { value: "wrong-item", label: "Wrong item received" },
  { value: "customer-changed-mind", label: "Customer changed mind" },
  { value: "expired", label: "Expired product" },
  { value: "other", label: "Other reason" },
];

const apiStateTone: Record<ApiState, string> = {
  loading: "border-blue-200 bg-blue-50 text-blue-700",
  api: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "mock-fallback": "border-amber-200 bg-amber-50 text-amber-700",
};

const MOCK_PRODUCTS: ApiProduct[] = [
  { id: "mock-chips", sku: "RTL-CHIPS-001", name: "Sea Salt Potato Chips", price: 18000, currentStock: 42, shelfLocation: "A1-01" },
  { id: "mock-coffee", sku: "RTL-DRINK-002", name: "Cold Brew Coffee 250ml", price: 22000, currentStock: 9, shelfLocation: "B2-03" },
  { id: "mock-noodle", sku: "RTL-NOODLE-006", name: "Instant Noodle Chicken", price: 4500, currentStock: 84, shelfLocation: "D1-02" },
  { id: "mock-rice", sku: "RTL-RICE-004", name: "Premium Rice 5kg", price: 78000, currentStock: 16, shelfLocation: "D3-01" },
];

type Step = "form" | "preview" | "result";

export default function RetailReturnsApiWorkspace() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [source, setSource] = useState<ApiState>("loading");
  const [apiError, setApiError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("form");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<RetailReturnReason>("customer-changed-mind");

  const [preview, setPreview] = useState<RetailReturnPreview | null>(null);
  const [result, setResult] = useState<RetailReturnResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      setSource("loading");
      try {
        const response = await fetch("/api/retail/products", { credentials: "include" });
        if (!response.ok) throw new Error(`API ${response.status}`);
        const json = await response.json();
        const items: ApiProduct[] = (json.data ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          sku: p.sku as string,
          name: p.name as string,
          price: p.price as number,
          currentStock: p.currentStock as number,
          shelfLocation: p.shelfLocation as string,
        }));
        if (items.length > 0) {
          setProducts(items);
          setSource("api");
          setSelectedProductId(items[0]?.id ?? "");
        } else {
          setProducts(MOCK_PRODUCTS);
          setSource("mock-fallback");
          setSelectedProductId(MOCK_PRODUCTS[0]?.id ?? "");
          setApiError("API returned zero products — showing local mock data.");
        }
      } catch (err) {
        setProducts(MOCK_PRODUCTS);
        setSource("mock-fallback");
        setSelectedProductId(MOCK_PRODUCTS[0]?.id ?? "");
        setApiError(err instanceof Error ? err.message : "Products API request failed.");
      }
    }
    void loadProducts();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  function buildInput(): RetailReturnInput {
    return {
      originalReceiptNumber: receiptNumber.trim() || undefined,
      reason,
      lines: selectedProductId ? [{ productId: selectedProductId, quantity }] : [],
    };
  }

  async function handlePreview() {
    if (!selectedProductId || quantity < 1) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await retailPreviewReturn(buildInput(), { credentials: "include" });
      const data = response.data as RetailReturnPreview;
      setPreview(data);
      setStep("preview");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Preview request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePersist() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await retailPersistReturn(buildInput(), { credentials: "include" });
      const data = response.data as RetailReturnResult;
      if (data.persisted) {
        setResult(data);
        setStep("result");
      } else {
        setSubmitError("Return requires manager review and cannot be auto-persisted for this role.");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Persist request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep("form");
    setReceiptNumber("");
    setQuantity(1);
    setReason("customer-changed-mind");
    setPreview(null);
    setResult(null);
    setSubmitError(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={apiStateTone[source]}>
            {source === "api" ? "Prisma API" : source === "loading" ? "Loading API" : "Mock fallback"}
          </Badge>
          <Badge variant="outline" className="border-rose-200 text-rose-700">
            Returns & Exchanges
          </Badge>
          {source === "api" ? (
            <Badge variant="outline" className="border-emerald-300 text-emerald-700">
              Writes database
            </Badge>
          ) : null}
        </div>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Returns are validated and persisted via the Retail API. The preview step checks restockability and manager review requirements before any database mutation occurs.
        </p>
        {apiError ? <p className="mt-2 text-xs text-amber-700">Note: {apiError}</p> : null}
      </div>

      {step === "form" && (
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              Return form
            </CardTitle>
            <CardDescription>
              Enter receipt number (optional), select the product and quantity to return, and choose the return reason.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-700">Original receipt number (optional)</label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g. RTL-20260618-1234567"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-700">Product to return</label>
              {source === "loading" ? (
                <div className="h-9 rounded-lg border border-neutral-200 bg-neutral-50 animate-pulse" />
              ) : (
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — {formatRetailCurrency(p.price)}
                    </option>
                  ))}
                </select>
              )}
              {selectedProduct ? (
                <p className="text-xs text-neutral-500">
                  Current stock: {selectedProduct.currentStock} · Shelf: {selectedProduct.shelfLocation}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-700">Quantity</label>
              <div className="inline-flex items-center rounded-lg border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-50"
                >
                  -
                </button>
                <span className="min-w-10 border-x px-4 py-2 text-center font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Return reason</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {returnReasons.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={reason === r.value
                      ? "rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-center text-sm font-medium text-rose-700"
                      : "rounded-lg border border-neutral-200 bg-white px-3 py-2 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {submitError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {submitError}
              </div>
            ) : null}

            <button
              type="button"
              disabled={!selectedProductId || quantity < 1 || submitting || source === "loading"}
              onClick={handlePreview}
              className="w-full rounded-lg bg-neutral-950 px-3 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {submitting ? "Calculating preview..." : source !== "api" ? "Preview (mock — no database write)" : "Preview return"}
            </button>
          </CardContent>
        </Card>
      )}

      {step === "preview" && preview ? (
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              Return preview
            </CardTitle>
            <CardDescription>Review the return before committing it to the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-sm text-neutral-400">Estimated refund</p>
                <p className="mt-1 text-xl font-bold text-neutral-950">{formatRetailCurrency(preview.estimatedRefund)}</p>
              </div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-sm text-neutral-400">Manager review needed</p>
                <p className={`mt-1 font-bold ${preview.requiresManagerReview ? "text-amber-700" : "text-emerald-700"}`}>
                  {preview.requiresManagerReview ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-sm text-neutral-400">Return lines</p>
                <p className="mt-1 font-bold text-neutral-950">{preview.restockableLines.length}</p>
              </div>
            </div>

            {preview.reviewReasons.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Review required for:
                </p>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {preview.reviewReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
                <tr>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 pr-4">Qty</th>
                  <th className="py-3 pr-4">Restockable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {preview.restockableLines.map((line) => (
                  <tr key={line.productId}>
                    <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{line.sku}</td>
                    <td className="py-3 pr-4 text-neutral-700">{line.quantity}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={line.restockable
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"}
                      >
                        {line.restockable ? "Yes" : "No"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {submitError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {submitError}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting || source !== "api"}
                onClick={handlePersist}
                className="flex-1 rounded-lg bg-rose-700 px-3 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {submitting
                  ? "Persisting return..."
                  : source !== "api"
                    ? "Persist disabled (mock fallback — no database write)"
                    : `Confirm return — refund ${formatRetailCurrency(preview.estimatedRefund)}`}
              </button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === "result" && result ? (
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              Return persisted
            </CardTitle>
            <CardDescription>
              Return {result.returnNumber} was posted to the database. Stock has been restocked and refund workflow created.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-sm text-neutral-400">Return number</p>
                <p className="mt-1 font-mono font-bold text-neutral-950">{result.returnNumber}</p>
              </div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-sm text-neutral-400">Original receipt</p>
                <p className="mt-1 font-mono font-bold text-neutral-950">{result.originalReceiptNumber}</p>
              </div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-sm text-neutral-400">Refund amount</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">{formatRetailCurrency(result.refundAmount)}</p>
              </div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-sm text-neutral-400">Restocked units</p>
                <p className="mt-1 font-bold text-neutral-950">{result.restockedQuantity}</p>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm text-neutral-600">
              <p><span className="font-medium">Cashflow entry:</span> {result.cashflowEntryId}</p>
              <p className="mt-1"><span className="font-medium">Stock movements:</span> {result.stockMovementIds.join(", ")}</p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Process another return
            </button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
