// // ============================================================================
// // Create New Application Test
// // Required: Update NofoID in test-data for the application creation flow to work
// // ============================================================================
// // This test verifies the application creation flow by navigating to the opportunity page,
// // opening the application modal, creating a new application with a timestamp-based name,
// // and confirming that the application was created successfully.
// // ============================================================================
// // ---- Imports ----
// import { test } from "@playwright/test";
// import { Help_createNewApplication } from "tests/e2e/helpers/create-new-application-utils";

// // ============================================================================
// // Main Test
// // ============================================================================

// test.describe("Create New Application Flow", () => {
//   // Ensure that the page is closed after each test to prevent resource leaks
//   test.afterEach(async ({ page }) => {
//     if (!page.isClosed()) {
//       await page.close();
//     }
//   });
//   // Test to create a new application and verify its creation
//   test("Create a new application and verify creation", async ({
//     page,
//   }, testInfo) => {
//     const applicantType = "INDIVIDUAL"; // Change to "ORGANIZATION" as needed
//     await Help_createNewApplication(testInfo, page, applicantType);
//   });
// });
