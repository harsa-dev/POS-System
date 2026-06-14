#!/usr/bin/env node

const baseUrl = (process.env.RAW_MATERIAL_API_BASE_URL ?? "http://localhost:3001/api").replace(/\/$/, "");
const cookie = process.env.RAW_MATERIAL_API_COOKIE;

const headers = {
  "content-type": "application/json",
  ...(cookie ? { cookie } : {}),
};

function endpoint(path) {
  return `${baseUrl}${path}`;
}

async function request(label, path, init = {}, options = {}) {
  const method = init.method ?? "GET";
  console.log(`\n[raw-material-api-smoke] ${label}`);
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
    console.error(`[raw-material-api-smoke] ${label} failed with ${response.status}`);
    console.error(payload);
    process.exit(1);
  }

  if (!response.ok) {
    console.warn(`[raw-material-api-smoke] ${label} returned ${response.status}; allowed for this optional step.`);
  }

  return { response, payload };
}

console.log("Raw Material API smoke script.");
console.log(`Base URL: ${baseUrl}`);
console.log(`Auth cookie: ${cookie ? "provided" : "not provided"}`);

await request("API health", "/health", {}, { allowFailure: true });

if (!cookie) {
  console.warn("\n[raw-material-api-smoke] RAW_MATERIAL_API_COOKIE is not provided. Authenticated Raw Material smoke checks are skipped.");
  console.warn("Set RAW_MATERIAL_API_COOKIE to run summary/list checks against a logged-in Raw Material business context.");
  process.exit(0);
}

await request("Raw Material summary", "/raw-material/summary");
await request("Raw Material suppliers", "/raw-material/suppliers");
await request("Raw Material storage locations", "/raw-material/storage-locations");
await request("Raw Material intakes", "/raw-material/intakes");
await request("Raw Material weighings", "/raw-material/weighings");
await request("Raw Material batches", "/raw-material/batches");
await request("Raw Material processing runs", "/raw-material/processing-runs");
await request("Raw Material kandang pens", "/raw-material/pens");
await request("Raw Material stock movements", "/raw-material/stock-movements");

console.log("\n[raw-material-api-smoke] Raw Material API smoke finished.");
