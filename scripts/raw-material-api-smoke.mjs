#!/usr/bin/env node

const baseUrl = (process.env.RAW_MATERIAL_API_BASE_URL ?? "http://localhost:3001/api").replace(/\/$/, "");
const cookie = process.env.RAW_MATERIAL_API_COOKIE;
const expectSeed = process.env.RAW_MATERIAL_SMOKE_EXPECT_SEED === "true";

const headers = {
  "content-type": "application/json",
  ...(cookie ? { cookie } : {}),
};

const readChecks = [
  {
    label: "Raw Material summary",
    path: "/raw-material/summary",
    expectedShape: "object",
    assert: assertSummary,
  },
  {
    label: "Raw Material suppliers",
    path: "/raw-material/suppliers",
    expectedShape: "array",
    seedMinimum: 3,
  },
  {
    label: "Raw Material storage locations",
    path: "/raw-material/storage-locations",
    expectedShape: "array",
    seedMinimum: 3,
  },
  {
    label: "Raw Material intakes",
    path: "/raw-material/intakes",
    expectedShape: "array",
    seedMinimum: 3,
  },
  {
    label: "Raw Material weighings",
    path: "/raw-material/weighings",
    expectedShape: "array",
    seedMinimum: 3,
  },
  {
    label: "Raw Material batches",
    path: "/raw-material/batches",
    expectedShape: "array",
    seedMinimum: 3,
  },
  {
    label: "Raw Material processing runs",
    path: "/raw-material/processing-runs",
    expectedShape: "array",
    seedMinimum: 1,
  },
  {
    label: "Raw Material kandang pens",
    path: "/raw-material/pens",
    expectedShape: "array",
    seedMinimum: 2,
  },
  {
    label: "Raw Material stock movements",
    path: "/raw-material/stock-movements",
    expectedShape: "array",
    seedMinimum: 3,
  },
];

function endpoint(path) {
  return `${baseUrl}${path}`;
}

function fail(message, details) {
  console.error(`\n[raw-material-api-smoke] ${message}`);

  if (details !== undefined) {
    console.error(details);
  }

  process.exit(1);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractData(payload) {
  if (!isRecord(payload)) {
    return payload;
  }

  return payload.data;
}

function assertEnvelope(label, payload) {
  if (!isRecord(payload)) {
    fail(`${label} did not return a JSON object envelope.`, payload);
  }

  if (payload.success !== true) {
    fail(`${label} returned an envelope without success=true.`, payload);
  }

  if (!("data" in payload)) {
    fail(`${label} returned an envelope without data.`, payload);
  }
}

function assertShape(label, payload, expectedShape) {
  const data = extractData(payload);

  if (expectedShape === "array" && !Array.isArray(data)) {
    fail(`${label} expected data array.`, payload);
  }

  if (expectedShape === "object" && !isRecord(data)) {
    fail(`${label} expected data object.`, payload);
  }

  return data;
}

function assertSeedMinimum(label, data, minimum) {
  if (!expectSeed) {
    return;
  }

  if (!Array.isArray(data)) {
    fail(`${label} cannot verify seed minimum because data is not an array.`, data);
  }

  if (data.length < minimum) {
    fail(`${label} expected at least ${minimum} seeded rows, got ${data.length}.`, data);
  }
}

function assertSummary(label, payload) {
  const data = assertShape(label, payload, "object");
  const requiredKeys = [
    "generatedAt",
    "business",
    "suppliers",
    "storage",
    "intakes",
    "weighings",
    "batches",
    "processing",
    "kandang",
    "stockMovements",
    "latestActivity",
  ];

  for (const key of requiredKeys) {
    if (!(key in data)) {
      fail(`${label} summary data is missing required key: ${key}`, data);
    }
  }

  return data;
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
    fail(`${label} failed with ${response.status}.`, payload);
  }

  if (!response.ok) {
    console.warn(`[raw-material-api-smoke] ${label} returned ${response.status}; allowed for this optional step.`);
  }

  return { response, payload };
}

console.log("Raw Material API smoke script.");
console.log(`Base URL: ${baseUrl}`);
console.log(`Auth cookie: ${cookie ? "provided" : "not provided"}`);
console.log(`Seed expectations: ${expectSeed ? "enabled" : "disabled"}`);

await request("API health", "/health", {}, { allowFailure: true });

if (!cookie) {
  console.warn("\n[raw-material-api-smoke] RAW_MATERIAL_API_COOKIE is not provided. Authenticated Raw Material smoke checks are skipped.");
  console.warn("Set RAW_MATERIAL_API_COOKIE to run envelope and shape checks against a logged-in Raw Material business context.");
  process.exit(0);
}

for (const check of readChecks) {
  const { payload } = await request(check.label, check.path);
  assertEnvelope(check.label, payload);

  const data = check.assert
    ? check.assert(check.label, payload)
    : assertShape(check.label, payload, check.expectedShape);

  if (typeof check.seedMinimum === "number") {
    assertSeedMinimum(check.label, data, check.seedMinimum);
  }
}

console.log("\n[raw-material-api-smoke] Raw Material authenticated API smoke finished.");