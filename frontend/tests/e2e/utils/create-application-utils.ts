// Utility function for application creation
// Usage: await createApplication(page, opportunityUrl, orgLabelLocal, orgLabelStaging);
import { expect } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";

const { baseUrl, targetEnv } = playwrightEnv;

/**
 * Creates a new application for the given opportunity.
 * @param page Playwright Page object
 * @param opportunityUrl Opportunity URL (e.g. "/opportunity/abc123")
 * @param orgLabelLocal Organization label for local environment
 * @param orgLabelStaging Organization label for staging environment
 */
export async function createApplication(
  page: import("@playwright/test").Page,
  opportunityUrl: string,
  orgLabelLocal: string,
  orgLabelStaging: string,
) {
  await page.goto(`${baseUrl}${opportunityUrl}`, {
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
  await expect(modal.locator("select")).toBeVisible({ timeout: 15000 });
  const orgSelect = modal.locator(
    'select[name*="applicant"], select:nth-of-type(1)',
  );
  const orgSelectCount = await orgSelect.count();
  if (orgSelectCount > 0) {
    const orgSelectFirst = orgSelect.first();
    await orgSelectFirst.waitFor({ state: "visible", timeout: 5000 });
    await expect(orgSelectFirst).toBeEnabled({ timeout: 10000 });
    await page.waitForFunction((selector) => {
      const select = document.querySelector(selector);
      if (!(select instanceof HTMLSelectElement)) return false;
      return Array.from(select.options).some((opt) => !opt.disabled);
    }, 'select[name*="applicant"], select:nth-of-type(1)');
    const options = await orgSelectFirst.locator("option").allTextContents();
    const enabledOptionValues = await orgSelectFirst
      .locator("option:not([disabled])")
      .evaluateAll((nodes) =>
        nodes
          .filter((n): n is HTMLOptionElement => n instanceof HTMLOptionElement)
          .map((n) => n.value),
      );
    let orgLabel = "";
    if (targetEnv === "local") {
      orgLabel =
        options.find((opt: string) => opt.includes(orgLabelLocal)) ||
        options[0];
    } else if (targetEnv === "staging") {
      orgLabel =
        options.find((opt: string) => opt.includes(orgLabelStaging)) ||
        options[0];
    } else {
      orgLabel = options[0];
    }
    if (orgLabel) {
      const orgValue = await orgSelectFirst
        .locator("option")
        .filter({ hasText: orgLabel })
        .first()
        .getAttribute("value");
      if (orgValue && enabledOptionValues.includes(orgValue)) {
        await orgSelectFirst.selectOption({ value: orgValue });
      } else if (enabledOptionValues.length > 0) {
        await orgSelectFirst.selectOption({ value: enabledOptionValues[0] });
      }
    }

    const selectedOrgValue = await orgSelectFirst.inputValue();
    if (!selectedOrgValue && enabledOptionValues.length > 0) {
      await orgSelectFirst.selectOption({ value: enabledOptionValues[0] });
    }
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
  const createButton = modal.locator('button:has-text("Create")');
  const createRequest = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/api/applications"),
    { timeout: 60000 },
  );
  if ((await createButton.count()) === 0) {
    const anyCreateBtn = page
      .getByRole("button")
      .filter({ hasText: /Create|Submit|Start|Next/ });
    await expect(anyCreateBtn.first()).toBeEnabled({ timeout: 10000 });
    await anyCreateBtn.first().scrollIntoViewIfNeeded();
    try {
      await anyCreateBtn.first().click({ timeout: 15000 });
    } catch (error) {
      await anyCreateBtn.first().click({ force: true });
    }
  } else {
    await expect(createButton.first()).toBeEnabled({ timeout: 10000 });
    await createButton.first().scrollIntoViewIfNeeded();
    try {
      await createButton.first().click({ timeout: 15000 });
    } catch (error) {
      await createButton.first().click({ force: true });
    }
  }
  await createRequest;
  await page.waitForTimeout(3000);
  await page.waitForURL(/\/applications\/[a-f0-9-]+/, { timeout: 60000 });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  const mainContent = page.locator("main");
  await expect(mainContent).toBeVisible();
  const requiredFormsHeading = page.locator(
    "text=/Required Forms/i, text=/forms required/i",
  );
  if ((await requiredFormsHeading.count()) > 0) {
    // Application page loaded with forms section
  }
  await expect(
    page.locator("a, button").filter({
      hasText: /SF-424B|Assurances for Non-Construction Programs/i,
    }),
  ).toBeVisible({ timeout: 60000 });
}
