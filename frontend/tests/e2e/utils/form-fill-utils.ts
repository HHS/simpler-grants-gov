/**
 * Form Field Filling Utility
 *
 * Provides a reusable helper function for filling form fields (text inputs and dropdowns)
 * in Playwright tests. Includes error handling and test report attachments.
 *
 * Usage:
 * import { fillField, FillFieldDefinition } from "tests/e2e/utils/test-form-fill-utls";
 * await fillField(testInfo, page, fieldDefinition);
 */

import { Page, TestInfo } from "@playwright/test";
import { selectDropdownByValueOrLabel } from "tests/e2e/utils/select-dropdown-utils";

// ============================================================================
// Field Definition Interface
// ============================================================================

export interface FillFieldDefinition {
  testId?: string;
  selector?: string;
  value: string;
  type: "text" | "dropdown";
  section: string;
}

// ============================================================================
// Helper Function to Fill a Single Field
// ============================================================================

/**
 * Fills a single form field with error handling and test reporting
 *
 * @param testInfo - Playwright TestInfo for attaching test results
 * @param page - Playwright Page object
 * @param field - Field definition including testId/selector, value, type, and section
 */
export async function fillField(
  testInfo: TestInfo,
  page: Page,
  field: FillFieldDefinition,
): Promise<void> {
  try {
    if (field.type === "dropdown" && field.selector) {
      // Use the existing robust dropdown utility function
      await selectDropdownByValueOrLabel(page, field.selector, field.value);
    } else if (field.type === "text" && field.testId) {
      const locator = page.getByTestId(field.testId);
      await locator.waitFor({ state: "attached", timeout: 5000 });
      await locator.fill(field.value);
    }

    await testInfo.attach(`fillField-${field.section}-success`, {
      body: `Successfully filled ${field.section}: "${field.value}"`,
      contentType: "text/plain",
    });
  } catch (error) {
    await testInfo.attach(`fillField-${field.section}-error`, {
      body: `Failed to fill ${field.section}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      contentType: "text/plain",
    });
    throw new Error(
      `Failed to fill ${field.section}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
