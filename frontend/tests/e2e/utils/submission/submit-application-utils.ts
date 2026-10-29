import { expect, Page, Request } from "@playwright/test";
import { UUID_REGEX } from "tests/e2e/utils/common/regex-utils";

export type SubmitOutcome = "success" | "validationError";

/**
 * Asserts the submission failure alert structure and verifies each expected
 * error appears in the alert list and is visible on the page.
 * @param page Playwright Page object
 * @param expectedErrors Errors that must be present in the alert list
 */
async function verifySubmissionValidationAlert(
  page: Page,
  expectedErrors: string[],
): Promise<void> {
  const alertLocator = page.getByTestId("alert");

  // Verify the alert heading
  await expect(alertLocator.getByRole("heading")).toContainText(
    "Your application could not be submitted",
  );

  // Verify the alert body contains the introductory sentence
  await expect(alertLocator.locator("div")).toContainText(
    "All required fields or attachments in required forms must be completed or uploaded.",
  );

  const alertList = alertLocator.getByRole("list");

  // Assert each expected error is present in the list and visible on the page
  for (const expectedError of expectedErrors) {
    await expect(alertList).toContainText(expectedError);
    await expect(page.getByText(expectedError)).toBeVisible();
  }
}

/**
 * Clicks submit, waits for the page response, and waits for either the
 * success or validation-error heading to appear.
 * @param page Playwright Page object
 * @returns Which outcome was rendered
 */
async function clickSubmitAndWaitForOutcome(
  page: Page,
): Promise<SubmitOutcome> {
  const submitAppButton = page.getByRole("button", {
    name: /submit application/i,
  });
  await submitAppButton.waitFor({ state: "visible", timeout: 15000 });
  await expect(submitAppButton).toBeEnabled({ timeout: 15000 });

  const successHeading = page.getByRole("heading", {
    name: /your application has been submitted/i,
  });
  const validationHeading = page.getByRole("heading", {
    name: /your application could not be submitted/i,
  });

  // Determine browser and set appropriate timeouts.
  // WebKit and Firefox are slower at both network event processing and DOM rendering.
  // Mobile Chrome also benefits from longer timeouts due to slower rendering on smaller viewports.
  const browserType = page.context().browser()?.browserType().name();
  const isWebKit = browserType === "webkit";
  const isFirefox = browserType === "firefox";
  // Detect mobile by viewport width (mobile viewports are typically < 500px)
  const viewportSize = page.viewportSize();
  const isMobileChrome =
    browserType === "chromium" && viewportSize && viewportSize.width < 500;

  // Set timeouts based on browser characteristics
  // WebKit requires significantly longer timeouts due to slower rendering and network event processing
  // Mobile Chrome also needs longer timeouts than desktop Chrome
  const responseTimeoutMs =
    isWebKit || isFirefox ? 60000 : isMobileChrome ? 30000 : 20000;
  // Must stay below the spec's 300s test timeout, otherwise the test times out
  // first, the page is closed, and the diagnostics in the catch below can never run.
  const domOutcomeTimeoutMs = isWebKit
    ? 180000
    : isFirefox || isMobileChrome
      ? 180000
      : 120000;

  // Set up response listener BEFORE clicking - in WebKit, timing is critical
  // We use this for logging only, not to determine outcome (prefixed with _ to indicate unused)
  const _submitResponsePromise = page
    .waitForResponse(
      (response) => {
        const url = response.url();
        return (
          response.request().method() === "POST" &&
          url.includes("/api/applications/") &&
          url.includes("/submit")
        );
      },
      { timeout: responseTimeoutMs },
    )
    .then((response) => {
      console.warn(`Submit response received: ${response.status()}`);
      return undefined;
    })
    .catch((_e) => {
      console.warn("Submit response timeout - proceeding to check DOM outcome");
      return undefined;
    });

  // Set up DOM outcome listeners BEFORE clicking to catch fast renders
  const domOutcomePromise = Promise.race<"success" | "validationError">([
    successHeading
      .waitFor({ state: "visible", timeout: domOutcomeTimeoutMs })
      .then(() => "success" as const),
    validationHeading
      .waitFor({ state: "visible", timeout: domOutcomeTimeoutMs })
      .then(() => "validationError" as const),
  ]);

  // Click submit. The button is enabled as soon as the server-rendered HTML
  // arrives, but its handler only exists after React hydrates, so a click that
  // lands too early is silently dropped (most often on WebKit) and no submit
  // request is ever sent. Re-click until the submit request is actually
  // observed, and never click again once it has been - that would double-submit.
  let submitRequestSeen = false;
  const onRequest = (request: Request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/applications/") &&
      request.url().includes("/submit")
    ) {
      submitRequestSeen = true;
    }
  };
  page.on("request", onRequest);
  try {
    await expect(async () => {
      // An outcome already on screen means a click got through (e.g. the request
      // URL didn't match our filter); stop retrying rather than risk a re-submit.
      if (
        (await successHeading.isVisible()) ||
        (await validationHeading.isVisible())
      ) {
        return;
      }
      if (!submitRequestSeen) {
        await submitAppButton.click({ timeout: 5000 });
      }
      await expect
        .poll(
          async () =>
            submitRequestSeen ||
            (await successHeading.isVisible()) ||
            (await validationHeading.isVisible()),
          { timeout: 10000 },
        )
        .toBe(true);
    }).toPass({ timeout: 90000, intervals: [0] });
  } finally {
    page.off("request", onRequest);
  }

  // Wait for DOM outcome - this is the real signal
  // Response promise fires in parallel for logging, but doesn't block outcome detection
  let outcome: "success" | "validationError";
  try {
    outcome = await domOutcomePromise;
  } catch (_e) {
    // Timeout occurred - debug what's actually on the page
    const currentUrl = page.url();
    const bodyText = await page.textContent("body");
    const allHeadings = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .allTextContents();
    const pageTitle = await page.title();

    console.error("Submission outcome detection timeout");
    console.error(`Current URL: ${currentUrl}`);
    console.error(`Page title: ${pageTitle}`);
    console.error(`All headings on page: ${allHeadings.join(" | ")}`);
    console.error(
      `Page content preview (first 500 chars): ${bodyText?.substring(0, 500)}`,
    );

    // Take screenshot for visual debugging
    await page.screenshot({ path: `submission-timeout-${Date.now()}.png` });

    throw new Error(
      `Failed to detect application submission outcome before the timeout. Current URL: ${currentUrl}`,
    );
  }

  return outcome;
}

/**
 * Submit the application and verify the outcome.
 *
 * - outcome "success"         — asserts success heading and returns the application ID.
 * - outcome "validationError" — asserts the failure alert and each expectedError;
 *                               requires expectedErrors to be provided.
 *
 * @param page Playwright Page object
 * @param outcome Expected result of the submission
 * @param expectedErrors Required when outcome is "validationError"; the error
 *                       strings that must appear in the alert list
 * @returns The application ID string when outcome is "success"; undefined otherwise
 */
export async function submitApplicationAndVerify(
  page: Page,
  outcome: SubmitOutcome,
  expectedErrors?: string[],
): Promise<string | undefined> {
  if (outcome === "validationError" && !expectedErrors?.length) {
    throw new Error(
      "expectedErrors must be provided when outcome is 'validationError'",
    );
  }

  const actual = await clickSubmitAndWaitForOutcome(page);

  if (actual !== outcome) {
    throw new Error(
      `Expected submission outcome "${outcome}" but got "${actual}"`,
    );
  }

  if (outcome === "validationError") {
    await verifySubmissionValidationAlert(page, expectedErrors!);
    return undefined;
  }

  // outcome === "success"
  await page.waitForTimeout(5000);

  const appIdMessages = await page.locator("div.usa-summary-box__text").all();
  let appIdMessage = null;
  for (const el of appIdMessages) {
    const text = await el.textContent();
    if (
      new RegExp(`Application ID #:\\s*${UUID_REGEX.source}`, "i").test(
        text || "",
      )
    ) {
      appIdMessage = el;
      break;
    }
  }

  if (!appIdMessage) {
    throw new Error("Could not find Application ID element");
  }

  await expect(appIdMessage).toBeVisible();

  const appIdText = await appIdMessage.textContent();
  const appIdMatch = appIdText?.match(
    new RegExp(`Application ID #:\\s*(${UUID_REGEX.source})`, "i"),
  );

  if (!appIdMatch || !appIdMatch[1]) {
    throw new Error("Could not extract Application ID from text");
  }

  return appIdMatch[1];
}

// --- Confirmation Page Validation ---
export async function verifySubmissionConfirmation(page: Page): Promise<void> {
  await expect(
    page.getByRole("heading", {
      name: /your application has been submitted/i,
    }),
  ).toBeVisible();

  await expect(page.getByTestId("summary-box")).toContainText(
    "Your application has been submitted",
  );
}
