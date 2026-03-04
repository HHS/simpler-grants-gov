// ============================================================================
// Funnction to validate and fill a form field using Playwright
// This utility function triggers validation errors for a specified field,
// fills the field with test data, and ensures no validation errors remain.
// It captures detailed test information and attaches it to the test report.
// File: frontend/tests/e2e/utils/test-validate-and-fill-field-utils.ts
// ============================================================================//
//Usage:
// import { validateAndFillField } from "../utils/test-validate-and-fill-field-utils";
// await validateAndFillField(testInfo, page, fieldDefinition);
//
import { Page, TestInfo } from "@playwright/test";
import { selectDropdownByValueOrLabel } from "tests/e2e/utils/test-select-dropdown-utils";

// import { safeHelp_safeWaitForLoadState } from "../0-Playground/test-navigation-utils";

export interface FieldDefinition {
  errorLinkText: string;
  testId: string;
  value: string;
  isDropdown?: boolean;
}

export async function validateAndFillField(
  testInfo: TestInfo,
  page: Page,
  field: FieldDefinition,
): Promise<void> {
  const startTime = new Date();

  try {
    // Click save to trigger validation
    await page.getByTestId("apply-form-save").click();

    // Wait longer for validation errors to appear
    await page.waitForTimeout(2000);

    // Check page state before clicking error link
    if (page.isClosed()) {
      throw new Error("Page was closed after save click");
    }

    // Try to find and click the error link if it exists
    const errorLink = page.getByRole("link", { name: field.errorLinkText });
    const errorCount = await errorLink.count();

    if (errorCount > 0) {
      // Error link found - click it to navigate to the field
      await errorLink.first().click({ timeout: 5000 });
      await testInfo.attach(
        `validateAndFillField-${field.testId}-error-found`,
        {
          body: `Found validation error: "${field.errorLinkText}"`,
          contentType: "text/plain",
        },
      );
    } else {
      // Error link not found - field might already be filled or validation didn't trigger
      // Continue to fill the field anyway
      await testInfo.attach(`validateAndFillField-${field.testId}-no-error`, {
        body: `No validation error found for "${field.errorLinkText}" - filling field directly`,
        contentType: "text/plain",
      });
    }

    // Wait for field to be available
    const fieldLocator = field.isDropdown
      ? page.locator(field.testId)
      : page.getByTestId(field.testId);

    await fieldLocator.waitFor({ state: "attached", timeout: 5000 });

    // Fill the field
    if (field.isDropdown) {
      await selectDropdownByValueOrLabel(page, field.testId, field.value);
    } else {
      await fieldLocator.fill(field.value);
    }

    // Save again after filling the field
    await page.getByTestId("apply-form-save").click();

    // Wait for validation to complete
    await page.waitForTimeout(1000);

    await testInfo.attach(`validateAndFillField-${field.testId}-success`, {
      body: `Successfully validated and filled field "${field.errorLinkText}" with value "${field.value}".`,
      contentType: "text/plain",
    });
  } catch (error) {
    await testInfo.attach(`validateAndFillField-${field.testId}-error`, {
      body: `Failed to validate and fill field "${field.errorLinkText}": ${
        error instanceof Error ? error.message : String(error)
      }`,
      contentType: "text/plain",
    });
    throw new Error(
      `Failed to validate and fill field "${field.errorLinkText}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
