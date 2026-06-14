#!/usr/bin/env node

const baseUrl = (process.env.RETAIL_API_BASE_URL ?? "http://localhost:3001/api").replace(/\/$/, "");
const cookie = process.env.RETAIL_API_COOKIE;
const productId = process.env.RETAIL_SMOKE_PRODUCT_ID;
const receivingId = process.env.RETAIL_SMOKE_RECEIVING_ID;
const receivingStatus = process.env.RETAIL_SMOKE_RECEIVING_STATUS ?? "ordered";
const saleId = process.env.RETAIL_SMOKE_SALE_ID;
const receiptNumber = process.env.RETAIL_SMOKE_RECEIPT_NUMBER;

const headers = {
  "content-type": "application/json",
  ...(cookie ? { cookie } : {}),
};

function endpoint(path) {
  return `${baseUrl}${path}`;
}

async function request(label, path, init = {}, options = {}) {
  const method = init.method ?? "GET";
  console.log(`\n[retail-api-smoke] ${label}`);
  console.log(`${method} ${endpoint(path)}`);

  const response = await fetch(endpoint(path), {
    ...init,
    headers: {
      ...headers,
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = text;
  }

  if (!response.ok && !options.allowFailure) {
    console.error(`[retail-api-smoke] ${label} failed with ${response.status}`);
    console.error(payload);
    process.exit(1);
  }

  if (!response.ok) {
    console.warn(`[retail-api-smoke] ${label} returned ${response.status}; allowed for this optional step.`);
  }

  return { response, payload };
}

console.log("Retail API smoke script.");
console.log(`Base URL: ${baseUrl}`);
console.log(`Auth cookie: ${cookie ? "provided" : "not provided"}`);

await request("Retail health", "/retail/health");

if (!cookie) {
  console.warn("\n[retail-api-smoke] RETAIL_API_COOKIE is not provided. Authenticated smoke checks are skipped.");
  console.warn("Set RETAIL_API_COOKIE to run products/dashboard/receiving checks against a logged-in Retail business context.");
  process.exit(0);
}

await request("Retail dashboard", "/retail/dashboard");
await request("Retail products", "/retail/products");
await request("Retail receiving queue", "/retail/receiving");

if (productId) {
  await request("Retail sale preview", "/retail/sales/preview", {
    method: "POST",
    body: JSON.stringify({
      lines: [{ productId, quantity: 1 }],
      discountRate: 0,
      taxIncluded: true,
    }),
  });
} else {
  console.warn("\n[retail-api-smoke] RETAIL_SMOKE_PRODUCT_ID not provided. Sale preview smoke is skipped.");
}

if (receivingId) {
  await request("Retail receiving status mutation", `/retail/receiving/${receivingId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: receivingStatus }),
  }, { allowFailure: true });
} else {
  console.warn("\n[retail-api-smoke] RETAIL_SMOKE_RECEIVING_ID not provided. Receiving mutation smoke is skipped.");
}

if (receiptNumber && productId) {
  await request("Retail return preview", "/retail/returns/preview", {
    method: "POST",
    body: JSON.stringify({
      originalReceiptNumber: receiptNumber,
      reason: "damaged",
      lines: [{ productId, quantity: 1 }],
    }),
  }, { allowFailure: true });
} else {
  console.warn("\n[retail-api-smoke] RETAIL_SMOKE_RECEIPT_NUMBER and RETAIL_SMOKE_PRODUCT_ID not provided. Return preview smoke is skipped.");
}

if (saleId) {
  await request("Retail sale cancellation mutation", `/retail/sales/${saleId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: "Retail smoke test cancellation" }),
  }, { allowFailure: true });
} else {
  console.warn("\n[retail-api-smoke] RETAIL_SMOKE_SALE_ID not provided. Cancellation smoke is skipped.");
}

console.log("\n[retail-api-smoke] Retail API smoke finished.");
