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

  // Set up response listener with browser-specific timeout.
  // WebKit is much slower at network event processing, so allow more time.
  const responseTimeoutMs =
    page.context().browser()?.browserType().name() === "webkit"
      ? 180000 // 3 minutes for WebKit
      : 60000; // 1 minute for Chrome/Firefox

  const submitResponsePromise = page.waitForResponse(
    (response) => {
      const url = response.url();
      return (
        response.request().method() === "POST" &&
        url.includes("/api/applications/") &&
        url.includes("/submit")
      );
    },
    { timeout: responseTimeoutMs },
  );

  await submitAppButton.click();

  // Set up DOM outcome detection
  const domOutcomePromise = Promise.race([
    successHeading.waitFor({ state: "visible", timeout: 120000 }),
    validationHeading.waitFor({ state: "visible", timeout: 120000 }),
  ]);

  // Wait for whichever comes first: response or DOM outcome
  let submitResponse: Response | undefined;
  try {
    // Try first race with explicit result tracking
    const result = await Promise.race([
      submitResponsePromise.then((resp) => ({
        type: "response" as const,
        value: resp,
      })),
      domOutcomePromise.then(() => ({ type: "dom" as const })),
    ]);

    if (result.type === "response") {
      submitResponse = result.value;
    }
    // If DOM outcome won the race, submitResponse stays undefined for now
  } catch (err) {
    // If first race failed, try to get response one more time
    try {
      submitResponse = await Promise.race([
        submitResponsePromise,
        new Promise<never>((_resolve, reject) =>
          setTimeout(
            () => reject(new Error("Failed to get /submit response")),
            10000,
          ),
        ),
      ]);
    } catch (_responseErr) {
      // Response never arrived, but DOM outcome may still appear - don't fail yet
      // Just ensure we have the DOM outcome
      await Promise.race([
        successHeading.waitFor({ state: "visible", timeout: 60000 }),
        validationHeading.waitFor({ state: "visible", timeout: 60000 }),
      ]);
    }
  }

  // Validate response status if we got one
  if (submitResponse && submitResponse.status() !== 200) {
    throw new Error(
      `Application submission returned status ${submitResponse.status()}`,
    );
  }

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);

  // Ensure outcome heading is visible
  await Promise.race([
    successHeading.waitFor({ state: "visible", timeout: 60000 }),
    validationHeading.waitFor({ state: "visible", timeout: 60000 }),
  ]);

  return (await validationHeading.isVisible()) ? "validationError" : "success";
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
