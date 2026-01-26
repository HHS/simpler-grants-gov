import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Timeout for each test in milliseconds
  timeout: 20000,
  testDir: './tests', // Ensure this points to the correct test directory
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,
  // Use 'blob' for CI to allow merging of reports. See https://playwright.dev/docs/test-reporters
  reporter: process.env.CI
    ? [['blob']]
    : // Don't open the HTML report since it hangs when running inside a container.
      // Use make e2e-show-report for opening the HTML report
      [['html', { open: 'never' }]],
  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: process.env.BASE_URL,

    // Pull request environments don't have HTTPS certificates
    ignoreHTTPSErrors: true,

    // Email service provider to use. Options are "MessageChecker" or "Mailinator". Defaults to "MessageChecker"
    // emailServiceType: "Mailinator",

    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
  },
  // Splits tests into chunks for distributed parallel execution
  shard: {
    // Total number of shards
    total: parseInt(process.env.TOTAL_SHARDS || '1'),
    // Specifies which shard this job should execute
    current: parseInt(process.env.CURRENT_SHARD || '1'),
  },

  // Configure projects for major browsers
  // Supported browsers: https://playwright.dev/docs/browsers#:~:text=Configure%20Browsers%E2%80%8B,Google%20Chrome%20and%20Microsoft%20Edge.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Test against mobile viewports.
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
