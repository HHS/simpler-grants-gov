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
    await orgSelect.first().waitFor({ state: "visible", timeout: 5000 });
    const options = await orgSelect.first().locator("option").allTextContents();
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
      await orgSelect.first().selectOption({ label: orgLabel });
    }
  }
  const nameInput = modal.locator(
    'input[name*="name"], input[placeholder*="application"], input[type="text"]:nth-of-type(1)',
  );
  if ((await nameInput.count()) > 0) {
    await nameInput.first().waitFor({ state: "visible", timeout: 5000 });
    const uniqueAppName = `TEST-APPLY-ORG-IND-APP${Date.now()}`;
    await nameInput.first().fill(uniqueAppName);
  }
  const createButton = modal.locator('button:has-text("Create")');
  if ((await createButton.count()) === 0) {
    const anyCreateBtn = page
      .getByRole("button")
      .filter({ hasText: /Create|Submit|Start|Next/ });
    await anyCreateBtn.first().click();
  } else {
    await createButton.first().click();
  }
  await page.waitForTimeout(3000);
  await page.waitForURL(/\/applications\/[a-f0-9-]+/, { timeout: 30000 });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
  const mainContent = page.locator("main");
  await expect(mainContent).toBeVisible();
  const requiredFormsHeading = page.locator(
    "text=/Required Forms/i, text=/forms required/i",
  );
  if ((await requiredFormsHeading.count()) > 0) {
    // Application page loaded with forms section
  }
}
