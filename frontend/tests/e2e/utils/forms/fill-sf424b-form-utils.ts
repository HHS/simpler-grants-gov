import { expect, type Locator, type Page } from "@playwright/test";
import { getFormLink } from "./form-link-utils";

/**
 * Gets the SF-424B form link element.
 * @param page Playwright Page object
 * @returns Locator for the SF-424B form link
 */
export function getSf424bFormLink(page: Page): Locator {
  return getFormLink(page, "SF-424B|Assurances for Non-Construction Programs");
}

/**
 * Verifies that the SF-424B form link is visible on the page.
 * @param page Playwright Page object
 */
export async function verifySf424bFormVisible(page: Page) {
  await expect(getSf424bFormLink(page)).toBeVisible({ timeout: 60000 });
}

/**
 * Fills the SF-424B form fields.
 * @param page Playwright Page object
 * @param title Title value to fill
 * @param organization Organization value to fill
 */
export async function fillSf424bForm(
  page: Page,
  title: string,
  organization: string,
) {
  // Find and fill the Title field
  let titleFieldFilled = false;
  const titleInputs = page.locator(
    'input[name*="title" i], input[placeholder*="title" i], textarea[name*="title" i], textarea[placeholder*="title" i]',
  );
  const titleCount = await titleInputs.count();
  if (titleCount > 0) {
    const titleField = titleInputs.first();
    await titleField.waitFor({ state: "visible", timeout: 10000 });
    await titleField.fill(title);
    titleFieldFilled = true;
  }
  if (!titleFieldFilled) {
    try {
      const titleLabelInput = page.getByLabel(/title/i).first();
      await titleLabelInput.waitFor({ state: "visible", timeout: 10000 });
      await titleLabelInput.fill(title);
      titleFieldFilled = true;
    } catch (err) {
      // Could not find title field via label
    }
  }
  if (!titleFieldFilled) {
    throw new Error("Could not fill SF-424B Title field");
  }

  // Find and fill Applicant Organization
  const orgInputs = page.locator(
    'input[name*="applicant" i], input[name*="organization" i]',
  );
  const orgCount = await orgInputs.count();
  if (orgCount > 0) {
    const orgField = orgInputs.first();
    await orgField.fill(organization);
  }
}
