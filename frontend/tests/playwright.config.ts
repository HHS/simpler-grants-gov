import { defineConfig, devices } from "@playwright/test";

import playwrightEnv from "./e2e/playwright-env";

const {
  baseUrl,
  targetEnv,
  webServerEnv,
  isCi,
  totalShards,
  currentShard,
  requestedProjects,
} = playwrightEnv;

const chromeProject = {
  name: "Chrome",
  use: {
    ...devices["Desktop Chrome"],
    permissions: ["clipboard-read", "clipboard-write"],
  },
};

const firefoxProject = {
  name: "Firefox",
  use: {
    ...devices["Desktop Firefox"],
    permissions: [],
  },
};

const webkitProject = {
  name: "Webkit",
  use: {
    ...devices["Desktop Safari"],
    permissions: ["clipboard-read"],
  },
};

const mobileChromeProject = {
  name: "Mobile chrome",
  use: {
    ...devices["Pixel 7"],
    permissions: ["clipboard-read", "clipboard-write"],
  },
};

/* Every project available for the current target. Deployed targets have only ever
   defined the two chromium projects — note that most specs additionally gate
   themselves to Chrome on a deployed target (see
   e2e/utils/auth/skip-non-chrome-staging-utils.ts), so adding Firefox or Webkit
   here would not exercise the authenticated flows until that gate is narrowed. */
const availableProjects =
  targetEnv !== "local"
    ? [chromeProject, mobileChromeProject]
    : [chromeProject, firefoxProject, webkitProject, mobileChromeProject];

/* PLAYWRIGHT_PROJECTS narrows the browser matrix without editing this file —
   PR smoke runs pass "Chrome" so they skip the Firefox / Webkit / mobile
   variants. We take this as an env var rather than Playwright's --project flag
   because the e2e composite action already threads every other setting through
   env, and project names containing spaces are awkward to quote through three
   duplicated `npm run test:e2e` steps. Unset (the default) runs every project
   for the target. */
const projectNames = requestedProjects
  ? requestedProjects
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
  : [];

const unknownProjectNames = projectNames.filter(
  (name) => !availableProjects.some((project) => project.name === name),
);

if (unknownProjectNames.length) {
  throw new Error(
    `Unknown PLAYWRIGHT_PROJECTS name(s): ${unknownProjectNames.join(", ")}. Available for target "${targetEnv}": ${availableProjects.map((project) => project.name).join(", ")}`,
  );
}

const projects = projectNames.length
  ? availableProjects.filter((project) => projectNames.includes(project.name))
  : availableProjects;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: targetEnv !== "local" ? 120000 : 75000,
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: targetEnv === "local",
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!isCi,
  /* Retry on CI only */
  retries: isCi ? 3 : 0,
  /* ci-frontend-e2e.yml — no workers passed → defaults to 10, sharding works as normal
     e2e-staging.yml — passes workers: 1 → PLAYWRIGHT_WORKERS=1, so each shard runs
     its own tests sequentially and concurrency comes from the shard matrix instead.
     Deployed targets share a handful of static test users (see utils/auth/test-users.ts),
     so in-process parallelism against one environment is riskier. */
  workers: process.env.PLAYWRIGHT_WORKERS
    ? parseInt(process.env.PLAYWRIGHT_WORKERS)
    : 10,
  // Use 'blob' for CI to allow merging of reports. See https://playwright.dev/docs/test-reporters
  reporter: isCi ? "blob" : "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: baseUrl,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "on",
    video: "on-first-retry",
    launchOptions:
      targetEnv !== "local"
        ? {
            args: ["--disable-dev-shm-usage"],
          }
        : undefined,
  },
  // Enable test sharding for parallelization in CI.
  shard: {
    // Total number of shards is specified via env variable or defaults to 1
    total: parseInt(totalShards || "1"),
    // Specifies which shard this job should execute
    current: parseInt(currentShard || "1"),
  },
  /* Configure projects for major browsers, optionally narrowed by
     PLAYWRIGHT_PROJECTS (see above) */
  projects,

  //  Only start the local dev server when running in the local environment.
  webServer:
    targetEnv !== "local"
      ? undefined
      : {
          command: "npm run start",
          url: baseUrl,
          reuseExistingServer: !isCi,
          env: webServerEnv,
          timeout: 120_000, // default is only 60s and can be too short for cold starts in CI causing webkit failures
        },
});
