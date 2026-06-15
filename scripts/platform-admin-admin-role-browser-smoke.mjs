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
      id: `admin-role-smoke-${role.toLowerCase()}`,
      name: `Admin Role Smoke ${role}`,
      email: `admin-role-smoke-${role.toLowerCase()}@example.test`,
      role,
      businessId: "admin-role-smoke-business",
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

async function expectNoRiskyButtons(page) {
  const riskyButtons = page.getByRole("button", {
    name: /delete|suspend|refund|elevate|promote|mutation|approve|reject|assign|revoke/i,
  });
  const count = await riskyButtons.count();
  record("no management mutation controls are visible", count === 0, `${count} risky button(s)`);
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
    await page.goto(`${APP_URL}/dashboard/internal/admin-role-console`, { waitUntil: "domcontentloaded" });
    await expectVisible(page, /Read-only Operation Notice/i, "read-only operation notice renders");
    await expectVisible(page, /Allowed Surface/i, "allowed surface card renders");
    await expectVisible(page, /GET-only|GET only/i, "GET-only surface is visible");
    await expectVisible(page, /Source:/i, "source badge renders");
    await expectVisible(page, /Read-only Safety Boundary/i, "read-only safety boundary renders");
    await expectVisible(page, /Section Source Health/i, "section source health renders");
    await expectVisible(page, /Console Metrics/i, "console metrics renders");
    await expectVisible(page, /Console Workflows/i, "console workflows renders");
    await expectVisible(page, /Read-only Rollout Preview/i, "rollout preview renders");
    await expectVisible(page, /Schema Candidates/i, "schema candidates renders");
    await expectNoRiskyButtons(page);
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
    await page.goto(`${APP_URL}/dashboard/internal/admin-role-console`, { waitUntil: "domcontentloaded" });
    await expectVisible(page, /Platform Admin Restricted/i, "MANAGER sees platform admin restricted panel");
    await expectVisible(page, /platform-admin\.admin-role-console\.read/i, "forbidden panel names required capability");
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
      "authenticated admin role browser smoke skipped",
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
  console.error(`\nPlatform Admin Admin Role Console browser smoke failed: ${failed.length} check(s).`);
  process.exit(1);
}

console.log(`\nPlatform Admin Admin Role Console browser smoke passed: ${checks.length} check(s).`);
