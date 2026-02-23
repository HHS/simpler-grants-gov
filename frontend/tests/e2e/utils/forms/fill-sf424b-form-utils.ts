import { expect, Page } from "@playwright/test";

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
    'input[name*="title" i], input[placeholder*="title" i]',
  );
  const titleCount = await titleInputs.count();
  if (titleCount > 0) {
    const titleField = titleInputs.first();
    await titleField.waitFor({ state: "visible", timeout: 3000 });
    await titleField.fill(title);
    titleFieldFilled = true;
  }
  if (!titleFieldFilled) {
    try {
      const titleLabelInput = page.getByLabel(/title/i).first();
      await titleLabelInput.waitFor({ state: "visible", timeout: 3000 });
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
