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
import { safeHelp_attachTestSummary, safeHelp_clickLink } from "tests/e2e/helpers/safeHelp";
import { Help_createNewApplication } from "tests/e2e/helpers/Help-create-new-application";

// ============================================================================
// Main Test
// ============================================================================

test.describe("Create New Application Flow", () => {
  test("should create a new application and verify creation", async ({ page }, testInfo) => {
    const { appLinkName, Nofo_directPageUrl, applicationId } = await Help_createNewApplication(testInfo, page);

    expect(appLinkName).toBeDefined();
    expect(Nofo_directPageUrl).toContain("/opportunity/");
    expect(applicationId).not.toBe("unknown");

    await testInfo.attach("application-details", {
      body: `App Name: ${appLinkName}\nDirect URL: ${Nofo_directPageUrl}\nApplication ID: ${applicationId}`,
      contentType: "text/plain",
    });
  });
});
