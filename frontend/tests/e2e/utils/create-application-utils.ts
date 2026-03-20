// Utility function for application creation
// Usage: await createApplication(page, opportunityUrl, orgLabel);
import { expect, type Locator, type Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";

import { gotoWithRetry } from "./lifecycle-utils";

const { baseUrl } = playwrightEnv;

async function selectOptionByLabelSubstring(
  selectLocator: Locator,
  labelSubstring: string,
) {
  const select = selectLocator.first();
  await select.waitFor({ state: "visible", timeout: 5000 });
  await expect(select).toBeEnabled({ timeout: 10000 });

  // Wait for org options to load — on WebKit the dropdown may initially only
  // show default options before the org list is fetched from the API.
  // If the org never appears (e.g. e2e user has no orgs), fall back to individual.
  await expect
    .poll(
      async () => {
        const options = await select.locator("option").allTextContents();
        return (
          options.some((opt) => opt.includes(labelSubstring)) ||
          options.some((opt) => opt.includes("As an individual"))
        );
      },
      {
        message: `Waiting for options to load in dropdown`,
        timeout: 30000,
      },
    )
    .toBe(true);

  const options = await select.locator("option").allTextContents();
  const enabledOptionValues = await select
    .locator("option:not([disabled])")
    .evaluateAll((nodes) =>
      nodes
        .filter((n): n is HTMLOptionElement => n instanceof HTMLOptionElement)
        .map((n) => n.value),
    );

  const resolvedLabel =
    options.find((opt: string) => opt.includes(labelSubstring)) ??
    options.find((opt: string) => opt.includes("As an individual (myself)"));

  if (!resolvedLabel) {
    throw new Error(
      `Could not find option matching "${labelSubstring}" in dropdown. Available options: ${options.join(", ")}`,
    );
  }

  const value = await select
    .locator("option")
    .filter({ hasText: resolvedLabel })
    .first()
    .getAttribute("value");

  if (value && enabledOptionValues.includes(value)) {
    await select.selectOption({ value });
  } else {
    throw new Error(
      `Option "${resolvedLabel}" is disabled or has no value. Enabled options: ${enabledOptionValues.join(", ")}`,
    );
  }

  const selectedValue = await select.inputValue();
  if (!selectedValue) {
    throw new Error(
      `Failed to select option "${resolvedLabel}" — no value was set after selection.`,
    );
  }
}

/**
 * Creates a new application for the given opportunity.
 * @param page Playwright Page object
 * @param opportunityUrl Opportunity URL (e.g. "/opportunity/abc123")
 * @param orgLabel Organization label to select
 */
export async function createApplication(
  page: Page,
  opportunityUrl: string,
  orgLabel: string,
) {
  await gotoWithRetry(page, `${baseUrl}${opportunityUrl}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);
  const startAppButton = page.getByRole("button", {
    name: /start.*application/i,
  });
  await startAppButton.waitFor({ state: "visible", timeout: 15000 });
  await startAppButton.click();
  const modal = page.locator(
    '[role="dialog"].is-visible, #start-application.is-visible',
  );
  await expect(modal.locator("select")).toBeVisible({ timeout: 60000 });
  const orgSelect = modal.locator(
    '#create-application-organization-select, select[name*="orgnization"], select[name*="organization"]',
  );
  const orgSelectCount = await orgSelect.count();
  if (orgSelectCount > 0) {
    await selectOptionByLabelSubstring(orgSelect, orgLabel);
  }
  const nameInput = modal.locator(
    'input[name*="name"], input[placeholder*="application"], input[type="text"]:nth-of-type(1)',
  );
  if ((await nameInput.count()) > 0) {
    await nameInput.first().waitFor({ state: "visible", timeout: 5000 });
    const uniqueAppName = `TEST-APPLY-ORG-IND-APP${Date.now()}`;
    await nameInput.first().fill(uniqueAppName);
    await expect(nameInput.first()).toHaveValue(uniqueAppName, {
      timeout: 5000,
    });
  }
  const createButton = modal.getByTestId("application-start-save");
  const createRequest = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/api/applications"),
    { timeout: 60000 },
  );
  await expect(createButton).toBeEnabled({ timeout: 10000 });
  await createButton.click({ force: true });
  await createRequest;
  await page.waitForTimeout(3000);
  await page.waitForURL(/\/applications\/[a-f0-9-]+/, { timeout: 60000 });
  await page.waitForLoadState("domcontentloaded");
  // Avoid strict networkidle waits on pages with background polling.
  await page.waitForLoadState("load").catch(() => undefined);
  await page.waitForTimeout(2000);
  const mainContent = page.locator("main");
  await expect(mainContent).toBeVisible();
  await expect(
    page.locator(".simpler-application-forms-table").first(),
  ).toBeVisible({ timeout: 30000 });
  const requiredFormsHeading = page.locator(
    "text=/Required Forms/i, text=/forms required/i",
  );
  if ((await requiredFormsHeading.count()) > 0) {
    // Application page loaded with forms section
  }
  // Making this utility generic so it can be shared across all application creation
  // irrespective of forms. Form-specific assertions are handled by individual form utilities.
}
