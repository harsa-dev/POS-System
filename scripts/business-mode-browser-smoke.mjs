#!/usr/bin/env node

const APP_URL = (process.env.BUSINESS_MODE_APP_URL ?? "http://localhost:5173").replace(/\/$/, "");
const AUTH_COOKIE = process.env.BUSINESS_MODE_SMOKE_COOKIE ?? "";
const HEADLESS = process.env.BUSINESS_MODE_SMOKE_HEADLESS !== "false";
const SKIP_AUTH = process.env.BUSINESS_MODE_SMOKE_SKIP_AUTH === "true";

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

async function withPage(fn) {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();

  if (AUTH_COOKIE) {
    await context.addCookies(parseCookieHeader(AUTH_COOKIE));
  }

  const page = await context.newPage();

  try {
    await fn(page);
  } finally {
    await browser.close();
  }
}

async function setMode(page, mode) {
  await page.goto(`${APP_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate((value) => {
    window.localStorage.setItem("currentBusinessMode", value);
  }, mode);
}

async function getStoredMode(page) {
  return page.evaluate(() => window.localStorage.getItem("currentBusinessMode"));
}

async function expectUrlContains(page, pattern, checkName) {
  await page.waitForTimeout(300);
  const url = page.url();
  const ok = pattern instanceof RegExp ? pattern.test(url) : url.includes(pattern);
  record(checkName, ok, url);
  return ok;
}

async function runSmoke(page) {
  await page.goto(`${APP_URL}/login`, { waitUntil: "domcontentloaded" });
  record("app is reachable", page.url().startsWith(APP_URL), page.url());

  if (!SKIP_AUTH && !AUTH_COOKIE) {
    record(
      "authenticated browser smoke skipped",
      true,
      "set BUSINESS_MODE_SMOKE_COOKIE to run protected route checks",
    );
    return;
  }

  await setMode(page, "retail");
  await page.goto(`${APP_URL}/workspace/restaurant/pos`, { waitUntil: "domcontentloaded" });
  await expectUrlContains(
    page,
    /\/select-mode\?next=.*workspace%2Frestaurant%2Fpos/,
    "restaurant route redirects to select-mode with next when retail is active",
  );

  await page.goto(`${APP_URL}/select-mode?next=%2Fworkspace%2Frestaurant%2Fpos`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("button", { name: /restaurant/i }).click();
  await expectUrlContains(
    page,
    "/workspace/restaurant/pos",
    "restaurant selection continues to compatible next route",
  );
  record("restaurant mode stored after selection", (await getStoredMode(page)) === "restaurant");

  await setMode(page, "restaurant");
  await page.goto(`${APP_URL}/v3/retail/cashier`, { waitUntil: "domcontentloaded" });
  await expectUrlContains(
    page,
    /\/select-mode\?next=.*v3%2Fretail%2Fcashier/,
    "retail route redirects to select-mode with next when restaurant is active",
  );

  await page.goto(`${APP_URL}/select-mode?next=%2Fv3%2Fretail%2Fcashier`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("button", { name: /retail/i }).click();
  await expectUrlContains(
    page,
    "/v3/retail/cashier",
    "retail selection continues to compatible next route",
  );
  record("retail mode stored after selection", (await getStoredMode(page)) === "retail");

  await setMode(page, "raw-material");
  await page.goto(`${APP_URL}/dashboard/cashflow`, { waitUntil: "domcontentloaded" });
  const cashflowMode = await getStoredMode(page);
  record("shared dashboard keeps active mode context", cashflowMode === "raw-material", cashflowMode ?? "missing");
}

await withPage(runSmoke);

const failed = checks.filter((check) => !check.ok);

if (failed.length > 0) {
  console.error(`\nBusiness-mode browser smoke failed: ${failed.length} check(s).`);
  process.exit(1);
}

console.log(`\nBusiness-mode browser smoke passed: ${checks.length} check(s).`);
