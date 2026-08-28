import { expect, Page } from "@playwright/test";
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
  const browserType = page.context().browser()?.browserType().name();
  const isWebKit = browserType === "webkit";
  const isFirefox = browserType === "firefox";

  // Set timeouts based on browser characteristics
  // For WebKit, use shorter timeout to fail faster if page isn't responding
  const responseTimeoutMs = isWebKit ? 30000 : (isFirefox ? 60000 : 20000);
  const domOutcomeTimeoutMs = isWebKit ? 180000 : (isFirefox ? 180000 : 120000);

  // Set up response listener BEFORE clicking - in WebKit, timing is critical
  // We use this for logging only, not to determine outcome
  const submitResponsePromise = page
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
    })
    .catch((_e) => {
      console.warn("Submit response timeout - proceeding to check DOM outcome");
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

  // Click submit
  await submitAppButton.click();

  // Wait for DOM outcome - this is the real signal
  // Response promise fires in parallel for logging, but doesn't block outcome detection
  let outcome: "success" | "validationError";
  try {
    outcome = await domOutcomePromise;
  } catch (_e) {
    // Timeout occurred - debug what's actually on the page
    const currentUrl = page.url();
    const bodyText = await page.textContent("body");
    const allHeadings = await page.locator("h1, h2, h3, h4, h5, h6").allTextContents();
    const pageTitle = await page.title();
    
    console.error("Submission outcome detection timeout");
    console.error(`Current URL: ${currentUrl}`);
    console.error(`Page title: ${pageTitle}`);
    console.error(`All headings on page: ${allHeadings.join(" | ")}`);
    console.error(`Page content preview (first 500 chars): ${bodyText?.substring(0, 500)}`);
    
    // Take screenshot for visual debugging
    await page.screenshot({ path: `submission-timeout-${Date.now()}.png` });
    
    throw new Error(
      `Failed to detect application submission outcome after 5 minutes. Current URL: ${currentUrl}`,
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
