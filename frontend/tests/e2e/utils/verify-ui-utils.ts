// ============================================================================
// Utility functions for verifying UI elements in E2E tests
// This module provides reusable functions for validating the presence and
// content of UI elements on web pages using Playwright.
//
// File: frontend/tests/e2e/utils/test-verify-ui-utils.ts
// ============================================================================
// Usage:
// import { verifyUIField, UIFieldDefinition } from "../utils/test-verify-ui-utils";
// await verifyUIField(testInfo, page, field);
//

import { Page, TestInfo } from "@playwright/test";

// ============================================================================
// Interface Definitions
// ============================================================================

export interface UIFieldDefinition {
  locator: string;
  expectedText: string;
  section: string;
}

// ============================================================================
// Helper Function to Verify a Single UI Field
// ============================================================================
/**
 * Verifies that a UI element contains the expected text content.
 * Normalizes whitespace to handle formatting variations in the DOM.
 *
 * @param testInfo - Playwright TestInfo object for attaching test reports
 * @param page - Playwright Page object for locating elements
 * @param field - UIFieldDefinition containing locator, expected text, and section name
 * @throws Error if the expected text is not found in the element
 */
export async function verifyUIField(
  testInfo: TestInfo,
  page: Page,
  field: UIFieldDefinition,
): Promise<void> {
  try {
    const element = page.locator(field.locator);

    // Playwright automatically normalizes whitespace and retries
    await expect(element).toContainText(field.expectedText);

    await testInfo.attach(`verifyUIField-${field.section}-success`, {
      body: `Successfully verified ${field.section}: "${field.expectedText}"`,
      contentType: "text/plain",
    });
  } catch (error: unknown) {
    await testInfo.attach(`verifyUIField-${field.section}-error`, {
      body: `Failed to verify ${field.section}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      contentType: "text/plain",
    });
    throw error;
  }
}
