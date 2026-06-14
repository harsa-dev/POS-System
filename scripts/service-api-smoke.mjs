#!/usr/bin/env node

const baseUrl = (process.env.SERVICE_API_BASE_URL ?? "http://localhost:3001/api").replace(/\/$/, "");
const cookie = process.env.SERVICE_API_COOKIE;
const expectSeed = process.env.SERVICE_SMOKE_EXPECT_SEED === "true";

const headers = {
  "content-type": "application/json",
  ...(cookie ? { cookie } : {}),
};

const readChecks = [
  {
    label: "Service Business summary",
    path: "/custom-business/service/summary",
    expectedShape: "object",
    assert: assertSummary,
  },
  {
    label: "Service Business workspace",
    path: "/custom-business/service/workspace",
    expectedShape: "object",
    assert: assertWorkspace,
    seedMinimumPath: "jobs",
    seedMinimum: 3,
  },
  {
    label: "Service Business jobs",
    path: "/custom-business/service/jobs",
    expectedShape: "object",
    assert: assertJobList,
    seedMinimumPath: "data",
    seedMinimum: 3,
  },
  {
    label: "Service Business workflow statuses",
    path: "/custom-business/service/workflow/statuses",
    expectedShape: "object",
    assert: assertWorkflowStatuses,
  },
];

function endpoint(path) {
  return `${baseUrl}${path}`;
}

function fail(message, details) {
  console.error(`\n[service-api-smoke] ${message}`);

  if (details !== undefined) {
    console.error(details);
  }

  process.exit(1);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function extractData(payload) {
  if (!isRecord(payload)) return payload;
  return payload.data;
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

function assertKeys(label, data, keys) {
  for (const key of keys) {
    if (!(key in data)) {
      fail(`${label} data is missing required key: ${key}`, data);
    }
  }
}

function readArrayPath(data, path) {
  if (!path) return Array.isArray(data) ? data : null;

  const value = path.split(".").reduce((current, key) => {
    if (!isRecord(current)) return undefined;
    return current[key];
  }, data);

  return Array.isArray(value) ? value : null;
}

function assertSeedMinimum(label, data, path, minimum) {
  if (!expectSeed) return;

  const rows = readArrayPath(data, path);
  if (!rows) {
    fail(`${label} cannot verify seed minimum because ${path || "data"} is not an array.`, data);
  }

  if (rows.length < minimum) {
    fail(`${label} expected at least ${minimum} seeded rows, got ${rows.length}.`, data);
  }
}

function assertSummary(label, payload) {
  const data = assertShape(label, payload, "object");
  assertKeys(label, data, [
    "generatedAt",
    "source",
    "totals",
    "money",
    "collection",
    "workflowDistribution",
    "invoiceDistribution",
    "latestJob",
  ]);
  assertKeys(label, data.totals, ["jobs", "activeJobs", "highPriorityJobs", "approvedQuotes", "issuedInvoices"]);

  if (expectSeed && data.totals.jobs < 3) {
    fail(`${label} expected at least 3 seeded jobs, got ${data.totals.jobs}.`, data);
  }

  return data;
}

function assertWorkspace(label, payload) {
  const data = assertShape(label, payload, "object");
  assertKeys(label, data, ["jobs", "generatedAt", "mode", "dryRun", "source"]);
  if (!Array.isArray(data.jobs)) {
    fail(`${label} expected jobs array.`, data);
  }
  return data;
}

function assertJobList(label, payload) {
  const data = assertShape(label, payload, "object");
  assertKeys(label, data, ["data", "meta"]);
  if (!Array.isArray(data.data)) {
    fail(`${label} expected nested data array.`, data);
  }
  return data;
}

function assertWorkflowStatuses(label, payload) {
  const data = assertShape(label, payload, "object");
  assertKeys(label, data, ["statuses", "transitions", "source"]);
  if (!Array.isArray(data.statuses)) {
    fail(`${label} expected statuses array.`, data);
  }
  return data;
}

async function request(label, path, init = {}, options = {}) {
  const method = init.method ?? "GET";
  console.log(`\n[service-api-smoke] ${label}`);
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
    console.warn(`[service-api-smoke] ${label} returned ${response.status}; allowed for this optional step.`);
  }

  return { response, payload };
}

console.log("Service Business API smoke script.");
console.log(`Base URL: ${baseUrl}`);
console.log(`Auth cookie: ${cookie ? "provided" : "not provided"}`);
console.log(`Seed expectations: ${expectSeed ? "enabled" : "disabled"}`);

await request("API health", "/health", {}, { allowFailure: true });

if (!cookie) {
  console.warn("\n[service-api-smoke] SERVICE_API_COOKIE is not provided. Authenticated Service Business smoke checks are skipped.");
  console.warn("Set SERVICE_API_COOKIE to run envelope and shape checks against a logged-in Service Business context.");
  process.exit(0);
}

for (const check of readChecks) {
  const { payload } = await request(check.label, check.path);
  assertEnvelope(check.label, payload);

  const data = check.assert
    ? check.assert(check.label, payload)
    : assertShape(check.label, payload, check.expectedShape);

  if (typeof check.seedMinimum === "number") {
    assertSeedMinimum(check.label, data, check.seedMinimumPath, check.seedMinimum);
  }
}

console.log("\n[service-api-smoke] Service Business authenticated API smoke finished.");
