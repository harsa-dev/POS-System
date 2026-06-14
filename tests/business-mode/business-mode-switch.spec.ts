import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const STORAGE_KEY = "currentBusinessMode";
const cookieHeader = process.env.BUSINESS_MODE_SMOKE_COOKIE ?? "";
const skipAuth = process.env.BUSINESS_MODE_SMOKE_SKIP_AUTH === "true";

function parseCookieHeader(baseURL: string, value: string) {
  const hostname = new URL(baseURL).hostname;

  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");
      const name = separatorIndex === -1 ? part : part.slice(0, separatorIndex);
      const cookieValue = separatorIndex === -1 ? "" : part.slice(separatorIndex + 1);

      return {
        name,
        value: cookieValue,
        domain: hostname,
        path: "/",
      };
    });
}

async function addAuthCookie(context: BrowserContext, baseURL: string) {
  if (!cookieHeader) return;
  await context.addCookies(parseCookieHeader(baseURL, cookieHeader));
}

async function setBusinessMode(page: Page, mode: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: STORAGE_KEY, value: mode },
  );
}

async function getBusinessMode(page: Page) {
  return page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
}

test.describe("business mode switch flow", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await addAuthCookie(context, baseURL ?? "http://localhost:5173");
  });

  test("app is reachable", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login|\/select-mode|\/dashboard|\/workspace|\/v3/);
  });

  test("mode mismatch redirects to select mode with next route", async ({ page }) => {
    test.skip(!skipAuth && !cookieHeader, "Set BUSINESS_MODE_SMOKE_COOKIE for protected route checks.");

    await setBusinessMode(page, "retail");
    await page.goto("/workspace/restaurant/pos", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/select-mode\?next=.*workspace%2Frestaurant%2Fpos/);

    await page.getByRole("button", { name: /restaurant/i }).click();
    await expect(page).toHaveURL(/\/workspace\/restaurant\/pos/);
    await expect.poll(() => getBusinessMode(page)).toBe("restaurant");
  });

  test("selected compatible retail mode continues to retail next route", async ({ page }) => {
    test.skip(!skipAuth && !cookieHeader, "Set BUSINESS_MODE_SMOKE_COOKIE for protected route checks.");

    await setBusinessMode(page, "restaurant");
    await page.goto("/v3/retail/cashier", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/select-mode\?next=.*v3%2Fretail%2Fcashier/);

    await page.getByRole("button", { name: /retail/i }).click();
    await expect(page).toHaveURL(/\/v3\/retail\/cashier/);
    await expect.poll(() => getBusinessMode(page)).toBe("retail");
  });

  test("shared dashboard keeps active mode context", async ({ page }) => {
    test.skip(!skipAuth && !cookieHeader, "Set BUSINESS_MODE_SMOKE_COOKIE for protected route checks.");

    await setBusinessMode(page, "raw-material");
    await page.goto("/dashboard/cashflow", { waitUntil: "domcontentloaded" });
    await expect.poll(() => getBusinessMode(page)).toBe("raw-material");
  });
});
