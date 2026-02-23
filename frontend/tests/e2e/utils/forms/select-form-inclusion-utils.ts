import { Page, expect } from "@playwright/test";

/**
 * Select Yes or No option for including a form in application submission.
 * @param page Playwright Page object
 * @param formName The form name to find in the row (e.g., "Disclosure of Lobbying Activities (SF-LLL)")
 * @param option "Yes" or "No" to select
 */
export async function selectFormInclusionOption(
  page: Page,
  formName: string,
  option: "Yes" | "No" = "Yes"
): Promise<void> {
  // Look for the form row by its text content (works across all tables)
  // Note: The text content may not have spaces, so use a flexible regex
  // Escape special regex characters and allow optional spaces
  const escapedFormName = formName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flexiblePattern = escapedFormName.replace(/\s+/g, "\\s*");
  const formRow = page.locator("tr", {
    hasText: new RegExp(flexiblePattern, "i"),
  });

  // Wait for row to be visible with extended timeout
  await expect(formRow).toBeVisible({ timeout: 12000 });

  // Find the label with the specified option (Yes or No)
  const optionLabel = formRow.locator("label.usa-radio__label", {
    hasText: new RegExp(`^${option}$`, "i"),
  });

  if ((await optionLabel.count()) > 0) {
    await optionLabel.first().scrollIntoViewIfNeeded();
    await expect(optionLabel.first()).toBeVisible({ timeout: 5000 });

    // Wait for the response when updating the form inclusion
    const includeFormResponsePromise = page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "PUT" &&
        url.includes("/api/applications/") &&
        url.includes("/forms/")
      );
    });

    await optionLabel.first().click();
    const includeFormResponse = await includeFormResponsePromise;

    if (includeFormResponse.status() !== 200) {
      throw new Error(
        `Include-in-submission update returned status ${includeFormResponse.status()}`
      );
    }
  } else {
    // Fallback: try without class selector
    const fallbackLabel = formRow.locator("label", {
      hasText: new RegExp(`^${option}$`, "i"),
    });

    if ((await fallbackLabel.count()) > 0) {
      await fallbackLabel.first().scrollIntoViewIfNeeded();
      await expect(fallbackLabel.first()).toBeVisible({ timeout: 10000 });

      const includeFormResponsePromise = page.waitForResponse((response) => {
        const url = response.url();
        return (
          response.request().method() === "PUT" &&
          url.includes("/api/applications/") &&
          url.includes("/forms/")
        );
      });

      await fallbackLabel.first().click();
      const includeFormResponse = await includeFormResponsePromise;

      if (includeFormResponse.status() !== 200) {
        throw new Error(
          `Include-in-submission update returned status ${includeFormResponse.status()}`
        );
      }
    } else {
      throw new Error(`Could not find '${option}' label for ${formName} row`);
    }
  }

  // Verify the radio is checked
  const optionRadio = formRow.getByRole("radio", {
    name: new RegExp(`^${option}$`, "i"),
  });
  await expect(optionRadio).toBeChecked({ timeout: 10000 });
}
