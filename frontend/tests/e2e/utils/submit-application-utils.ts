import { expect, Page } from "@playwright/test";
import { UUID_REGEX } from "tests/e2e/utils/regex-utils";

/**
 * Submit the application and verify success message with application ID.
 * @param page Playwright Page object
 * @returns The application ID that was submitted
 */
export async function submitApplicationAndVerify(page: Page): Promise<string> {
  const submitAppButton = page.getByRole("button", {
    name: /submit application/i,
  });
  await submitAppButton.waitFor({ state: "visible", timeout: 15000 });
  await expect(submitAppButton).toBeEnabled({ timeout: 15000 });

  // Wait for the submission response
  const submitResponsePromise = page.waitForResponse((response) => {
    const url = response.url();
    return (
      response.request().method() === "POST" &&
      url.includes("/api/applications/") &&
      url.includes("/submit")
    );
  });

  await submitAppButton.click();
  const submitResponse = await submitResponsePromise;

  if (submitResponse.status() !== 200) {
    throw new Error(
      `Application submission returned status ${submitResponse.status()}`,
    );
  }

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);

  // Step: Success message shows up with application ID
  const successHeading = page.getByRole("heading", {
    name: /your application has been submitted/i,
  });
  const validationHeading = page.getByRole("heading", {
    name: /your application could not be submitted/i,
  });

  await Promise.race([
    successHeading.waitFor({ state: "visible", timeout: 120000 }),
    validationHeading.waitFor({ state: "visible", timeout: 120000 }),
  ]);

  if (await validationHeading.isVisible()) {
    throw new Error(
      "Application submission validation errors were displayed after submit",
    );
  }

  await expect(successHeading).toBeVisible({ timeout: 120000 });
  await page.waitForTimeout(5000);

  // Find the Application ID element
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

  // Extract and verify application ID format (UUID)
  const appIdText = await appIdMessage.textContent();
  const appIdMatch = appIdText?.match(
    new RegExp(`Application ID #:\\s*(${UUID_REGEX.source})`, "i"),
  );

  if (!appIdMatch || !appIdMatch[1]) {
    throw new Error("Could not extract Application ID from text");
  }

  return appIdMatch[1];
}
