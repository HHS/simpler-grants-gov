// ============================================================================
// Create New Application Test
// Required: Update NofoID in test-data for the application creation flow to work
// ============================================================================
// This test verifies the application creation flow by navigating to the opportunity page,
// opening the application modal, creating a new application with a timestamp-based name,
// and confirming that the application was created successfully.  
// ============================================================================
// ---- Imports ----
import { test, expect } from "@playwright/test";
import { Help_createNewApplication } from "tests/e2e/helpers/Help-create-new-application";
import { safeHelp_safeExpect } from "tests/e2e/helpers/safeHelp";

// ============================================================================
// Main Test
// ============================================================================

test.describe("Create New Application Flow", () => {
  test.afterEach(async ({ page }) => {
    if (!page.isClosed()) {
      await page.close();
    }
  });

  test("Create a new application and verify creation", async ({ page }, testInfo) => {
    const applicantType = "INDIVIDUAL"; // Change to "ORGANIZATION" as needed
    const { appLinkName, Nofo_directPageUrl, applicationId } = await Help_createNewApplication(testInfo, page, applicantType);

    await safeHelp_safeExpect(testInfo, async () => { expect(appLinkName).toBeDefined(); });
    await safeHelp_safeExpect(testInfo, async () => { expect(Nofo_directPageUrl).toContain("/opportunity/"); });
    await safeHelp_safeExpect(testInfo, async () => { expect(applicationId).not.toBe("unknown"); });

    await testInfo.attach("application-details", {
      body: `App Name: ${appLinkName}\nDirect URL: ${Nofo_directPageUrl}\nApplication ID: ${applicationId}`,
      contentType: "text/plain",
    });
  });
});
