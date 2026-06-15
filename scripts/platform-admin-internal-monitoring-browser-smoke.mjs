#!/usr/bin/env node

const APP_URL = (process.env.PLATFORM_ADMIN_APP_URL ?? "http://localhost:5173").replace(/\/$/, "");
const AUTH_COOKIE = process.env.PLATFORM_ADMIN_SMOKE_COOKIE ?? "";
const HEADLESS = process.env.PLATFORM_ADMIN_SMOKE_HEADLESS !== "false";
const SKIP_AUTH = process.env.PLATFORM_ADMIN_SMOKE_SKIP_AUTH === "true";
const USE_MOCK_AUTH = process.env.PLATFORM_ADMIN_SMOKE_USE_MOCK_AUTH !== "false";

const checks = [];

function record(name, ok, details = "") {
  checks.push({ name, ok, details });
  const symbol = ok ? "✓" : "✗";
  console.log(`${symbol} ${name}${details ? ` - ${details}` : ""}`);
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    console.error("\nPlaywright is not installed.");
    console.error("Install it when browser smoke is needed:");
    console.error("  pnpm add -D playwright");
    console.error("  pnpm exec playwright install chromium\n");
    process.exit(1);
  }
}

function parseCookieHeader(cookieHeader) {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf("=");
      const name = separator === -1 ? part : part.slice(0, separator);
      const value = separator === -1 ? "" : part.slice(separator + 1);
      return {
        name,
        value,
        domain: new URL(APP_URL).hostname,
        path: "/",
      };
    });
}

function createMockUser(role) {
  return {
    success: true,
    data: {
      id: `platform-smoke-${role.toLowerCase()}`,
      name: `Platform Smoke ${role}`,
      email: `platform-smoke-${role.toLowerCase()}@example.test`,
      role,
      businessId: "platform-smoke-business",
    },
  };
}

async function prepareContext(browser, role) {
  const context = await browser.newContext();

  await context.addInitScript(() => {
    window.localStorage.setItem("currentBusinessMode", "restaurant");
  });

  if (AUTH_COOKIE && !USE_MOCK_AUTH) {
    await context.addCookies(parseCookieHeader(AUTH_COOKIE));
  }

  if (USE_MOCK_AUTH && role) {
    await context.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createMockUser(role)),
      });
    });
  }

  return context;
}

async function expectVisible(page, textOrPattern, name) {
  const locator = page.getByText(textOrPattern);
  try {
    await locator.first().waitFor({ state: "visible", timeout: 5000 });
    record(name, true);
    return true;
  } catch {
    record(name, false, `missing ${textOrPattern}`);
    return false;
  }
}

async function expectNoDangerButtons(page) {
  const dangerButtons = page.getByRole("button", {
    name: /acknowledge|delete|suspend|refund|elevate|promote|mutation/i,
  });
  const count = await dangerButtons.count();
  record("no internal mutation controls are visible", count === 0, `${count} risky button(s)`);
}

async function runReachabilitySmoke(browser) {
  const context = await prepareContext(browser, null);
  const page = await context.newPage();

  try {
    await page.goto(`${APP_URL}/login`, { waitUntil: "domcontentloaded" });
    record("app is reachable", page.url().startsWith(APP_URL), page.url());
  } finally {
    await context.close();
  }
}

async function runAdminSmoke(browser) {
  const context = await prepareContext(browser, USE_MOCK_AUTH ? "ADMIN" : null);
  const page = await context.newPage();

  try {
    await page.goto(`${APP_URL}/dashboard/internal-monitoring`, { waitUntil: "domcontentloaded" });
    await expectVisible(page, /Read-only internal monitoring/i, "read-only safety banner renders");
    await expectVisible(page, /Source Health/i, "source health summary renders");
    await expectVisible(page, /Internal Monitoring sections/i, "quick section navigation renders");
    await expectVisible(page, /Route Inventory/i, "route inventory section renders");
    await expectVisible(page, /Data Integrity Checks/i, "data integrity section renders");
    await expectVisible(page, /GET-only/i, "GET-only badge renders");
    await expectNoDangerButtons(page);
  } finally {
    await context.close();
  }
}

async function runForbiddenSmoke(browser) {
  if (!USE_MOCK_AUTH) {
    record(
      "non-platform-admin forbidden smoke skipped",
      true,
      "set PLATFORM_ADMIN_SMOKE_USE_MOCK_AUTH=true to simulate MANAGER denial",
    );
    return;
  }

  const context = await prepareContext(browser, "MANAGER");
  const page = await context.newPage();

  try {
    await page.goto(`${APP_URL}/dashboard/internal-monitoring`, { waitUntil: "domcontentloaded" });
    await expectVisible(page, /Platform Admin Restricted/i, "MANAGER sees platform admin restricted panel");
    await expectVisible(page, /platform-admin\.internal-monitoring\.read/i, "forbidden panel names required capability");
  } finally {
    await context.close();
  }
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: HEADLESS });

try {
  await runReachabilitySmoke(browser);

  if (!SKIP_AUTH && !AUTH_COOKIE && !USE_MOCK_AUTH) {
    record(
      "authenticated platform admin browser smoke skipped",
      true,
      "set PLATFORM_ADMIN_SMOKE_COOKIE or keep PLATFORM_ADMIN_SMOKE_USE_MOCK_AUTH=true",
    );
  } else {
    await runAdminSmoke(browser);
    await runForbiddenSmoke(browser);
  }
} finally {
  await browser.close();
}

const failed = checks.filter((check) => !check.ok);

if (failed.length > 0) {
  console.error(`\nPlatform Admin Internal Monitoring browser smoke failed: ${failed.length} check(s).`);
  process.exit(1);
}

console.log(`\nPlatform Admin Internal Monitoring browser smoke passed: ${checks.length} check(s).`);
