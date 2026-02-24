// Utility function for application creation
// Usage: await createApplication(page, opportunityUrl, orgLabel);
import { expect, type Locator, type Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";

const { baseUrl } = playwrightEnv;

async function selectOptionByLabelSubstring(
  selectLocator: Locator,
  labelSubstring: string,
) {
  const select = selectLocator.first();
  await select.waitFor({ state: "visible", timeout: 5000 });
  await expect(select).toBeEnabled({ timeout: 10000 });
  await expect
    .poll(async () =>
      select.evaluate((el) => {
        if (!(el instanceof HTMLSelectElement)) return false;
        return Array.from(el.options).some((opt) => !opt.disabled);
      }),
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
    options.find((opt: string) => opt.includes(labelSubstring)) || options[0];

  if (resolvedLabel) {
    const value = await select
      .locator("option")
      .filter({ hasText: resolvedLabel })
      .first()
      .getAttribute("value");

    if (value && enabledOptionValues.includes(value)) {
      await select.selectOption({ value });
    } else if (enabledOptionValues.length > 0) {
      await select.selectOption({ value: enabledOptionValues[0] });
    }
  }

  const selectedValue = await select.inputValue();
  if (!selectedValue && enabledOptionValues.length > 0) {
    await select.selectOption({ value: enabledOptionValues[0] });
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
  const createButton = modal.getByRole("button", {
    name: /create|submit|start|next/i,
  });
  const createRequest = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/api/applications"),
    { timeout: 60000 },
  );
  await expect(createButton.first()).toBeEnabled({ timeout: 10000 });
  await modal.scrollIntoViewIfNeeded();
  await modal
    .locator(".usa-modal__main, .usa-modal__content, .usa-modal__body")
    .first()
    .evaluate((el) => {
      (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight;
    })
    .catch(() => undefined);
  await createButton.first().scrollIntoViewIfNeeded();
  try {
    await createButton.first().click({ timeout: 15000 });
  } catch (error) {
    await createButton.first().click({ force: true });
    await createButton.first().evaluate((el) => (el as HTMLElement).click());
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
  // Making this utility generic so it can be shared across all application creation
  // irrespective of forms - this checks if the page has successfully loaded when we reach this point.
  // Form-specific assertion commented out for reusability - uncomment if form-specific validation is needed
  // await expect(
  //   page.locator("a, button").filter({
  //     hasText: /SF-424B|Assurances for Non-Construction Programs/i,
  //   }),
  // ).toBeVisible({ timeout: 60000 });
}
