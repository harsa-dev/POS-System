#!/usr/bin/env node

const baseUrl = (process.env.RESTAURANT_API_BASE_URL ?? "http://localhost:3001/api").replace(/\/$/, "");
const cookie = process.env.RESTAURANT_API_COOKIE;
const expectSeed = process.env.RESTAURANT_SMOKE_EXPECT_SEED === "true";
const menuItemId = process.env.RESTAURANT_SMOKE_MENU_ITEM_ID;
const tableId = process.env.RESTAURANT_SMOKE_TABLE_ID;
const orderId = process.env.RESTAURANT_SMOKE_ORDER_ID;
const statusOrderId = process.env.RESTAURANT_SMOKE_STATUS_ORDER_ID;
const statusTarget = process.env.RESTAURANT_SMOKE_STATUS_TARGET ?? "PREPARING";
const paymentReversalOrderId = process.env.RESTAURANT_SMOKE_PAYMENT_REVERSAL_ORDER_ID;
const cancellationOrderId = process.env.RESTAURANT_SMOKE_CANCELLATION_ORDER_ID;

const headers = {
  "content-type": "application/json",
  "x-business-mode": "restaurant",
  ...(cookie ? { cookie } : {}),
};

const readChecks = [
  {
    label: "Restaurant dashboard",
    path: "/restaurant/dashboard",
    expectedShape: "object",
    assert: assertDashboard,
  },
  {
    label: "Restaurant menu items",
    path: "/restaurant/menu-items",
    expectedShape: "array",
    seedMinimum: 5,
  },
  {
    label: "Restaurant tables",
    path: "/restaurant/tables",
    expectedShape: "array",
    seedMinimum: 5,
  },
  {
    label: "Restaurant active orders",
    path: "/restaurant/orders/active",
    expectedShape: "array",
    seedMinimum: 5,
  },
  {
    label: "Restaurant kitchen queue",
    path: "/restaurant/kitchen",
    expectedShape: "array",
  },
  {
    label: "Restaurant serving queue",
    path: "/restaurant/serving",
    expectedShape: "array",
  },
  {
    label: "Restaurant workflow",
    path: "/restaurant/workflow",
    expectedShape: "object",
    assert: assertWorkflow,
  },
  {
    label: "Restaurant shared dashboard overview",
    path: "/restaurant/shared-dashboard/overview",
    expectedShape: "object",
  },
];

function endpoint(path) {
  return `${baseUrl}${path}`;
}

function fail(message, details) {
  console.error(`\n[restaurant-api-smoke] ${message}`);

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
  if (!expectSeed) return;

  if (!Array.isArray(data)) {
    fail(`${label} cannot verify seed minimum because data is not an array.`, data);
  }

  if (data.length < minimum) {
    fail(`${label} expected at least ${minimum} seeded rows, got ${data.length}.`, data);
  }
}

function assertRequiredKeys(label, data, keys) {
  for (const key of keys) {
    if (!(key in data)) {
      fail(`${label} data is missing required key: ${key}`, data);
    }
  }
}

function assertDashboard(label, payload) {
  const data = assertShape(label, payload, "object");
  assertRequiredKeys(label, data, ["generatedAt", "window", "totals", "sales", "payments", "operations", "inventory", "health"]);
  return data;
}

function assertWorkflow(label, payload) {
  const data = assertShape(label, payload, "object");
  assertRequiredKeys(label, data, ["generatedAt", "totals", "stages", "transitions", "nextActions", "stuckOrders", "source"]);
  return data;
}

async function request(label, path, init = {}, options = {}) {
  const method = init.method ?? "GET";
  console.log(`\n[restaurant-api-smoke] ${label}`);
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
    console.warn(`[restaurant-api-smoke] ${label} returned ${response.status}; allowed for this optional step.`);
  }

  return { response, payload };
}

console.log("Restaurant API smoke script.");
console.log(`Base URL: ${baseUrl}`);
console.log(`Auth cookie: ${cookie ? "provided" : "not provided"}`);
console.log(`Seed expectations: ${expectSeed ? "enabled" : "disabled"}`);

await request("Restaurant health", "/restaurant/health");

if (!cookie) {
  console.warn("\n[restaurant-api-smoke] RESTAURANT_API_COOKIE is not provided. Authenticated Restaurant smoke checks are skipped.");
  console.warn("Set RESTAURANT_API_COOKIE to run dashboard/menu/order/workflow checks against a logged-in Restaurant business context.");
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

if (menuItemId) {
  await request("Restaurant order preview", "/restaurant/orders/preview", {
    method: "POST",
    body: JSON.stringify({
      type: tableId ? "DINE_IN" : "TAKEAWAY",
      tableId: tableId ?? null,
      paymentMethod: "CASH",
      amountPaid: 1000000,
      items: [{ menuItemId, quantity: 1 }],
    }),
  });
} else {
  console.warn("\n[restaurant-api-smoke] RESTAURANT_SMOKE_MENU_ITEM_ID not provided. Order preview smoke is skipped.");
}

if (orderId) {
  await request("Restaurant payment reversal preview", `/restaurant/orders/${orderId}/payment-reversal/preview`, {
    method: "POST",
    body: JSON.stringify({ action: "refund", reason: "Restaurant smoke payment reversal preview" }),
  }, { allowFailure: true });
} else {
  console.warn("\n[restaurant-api-smoke] RESTAURANT_SMOKE_ORDER_ID not provided. Payment reversal preview smoke is skipped.");
}

if (statusOrderId) {
  await request("Restaurant status preview", `/restaurant/orders/${statusOrderId}/status/preview`, {
    method: "POST",
    body: JSON.stringify({ targetStatus: statusTarget }),
  }, { allowFailure: true });
} else {
  console.warn("\n[restaurant-api-smoke] RESTAURANT_SMOKE_STATUS_ORDER_ID not provided. Status preview smoke is skipped.");
}

if (paymentReversalOrderId) {
  await request("Restaurant payment reversal mutation", `/restaurant/orders/${paymentReversalOrderId}/payment-reversal`, {
    method: "POST",
    body: JSON.stringify({ action: "refund", reason: "Restaurant smoke refund" }),
  }, { allowFailure: true });
} else {
  console.warn("\n[restaurant-api-smoke] RESTAURANT_SMOKE_PAYMENT_REVERSAL_ORDER_ID not provided. Payment reversal mutation smoke is skipped.");
}

if (cancellationOrderId) {
  await request("Restaurant cancellation mutation", `/restaurant/orders/${cancellationOrderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: "Restaurant smoke cancellation" }),
  }, { allowFailure: true });
} else {
  console.warn("\n[restaurant-api-smoke] RESTAURANT_SMOKE_CANCELLATION_ORDER_ID not provided. Cancellation mutation smoke is skipped.");
}

console.log("\n[restaurant-api-smoke] Restaurant API smoke finished.");
