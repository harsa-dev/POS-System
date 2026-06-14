const appUrl = process.env.BUSINESS_MODE_APP_URL ?? "http://localhost:5173";
const headless = process.env.BUSINESS_MODE_SMOKE_HEADLESS !== "false";

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
  testDir: "./tests/business-mode",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: appUrl,
    headless,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
};
