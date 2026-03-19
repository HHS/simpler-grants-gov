// // ============================================================================
// //  My quick debug area Yo Yo !!
// //  I import everything I need and not need here for quick testing
// // ============================================================================
// import { test } from "@playwright/test";
// import { testDataHelp_getFiscalYearQuarter as safeHelp_getFiscalYearQuarter } from "tests/e2e/0-Playground/test-data-utils";
// // import { ENTITY_DATA, Help_validateSFLLLv20Form } from "tests/e2e/helpers/validation-sflll-form-utils";
// import { safeHelp_fillFieldsByTestId } from "tests/e2e/0-Playground/test-form-fill-utils";
// import {
//   ensurePageClosedAfterEach,
//   safeHelp_safeWaitForLoadState,
// } from "tests/e2e/utils/test-navigation-utils";

// // import { createSpoofedSessionCookie } from "tests/e2e/loginUtils";

// test.describe("Quick debug", () => {
//   ensurePageClosedAfterEach(test);

//   test("Option 1", async ({
//     page,
//     // context
//   }, testInfo) => {
//     // const opportunity_Url = `/opportunity/01ccf5e6-93f7-446b-b5b2-4d6724948dd3d`;
//     const applicationUrl = `/applications/2b61a813-c04b-4414-b5f5-e2ee492dc181`;
//     // Navigate to the opportunity page and verify the "Start new application" button is visible
//     await page.goto(applicationUrl, { waitUntil: "load", timeout: 30000 });
//     await safeHelp_safeWaitForLoadState(testInfo, page, "load");
//     await testInfo.attach("fiscal-quarter", {
//       body: JSON.stringify(safeHelp_getFiscalYearQuarter()),
//       contentType: "application/json",
//     });

//     await safeHelp_fillFieldsByTestId(testInfo, page, [
//       {
//         testId: "material_change_year",
//         value: safeHelp_getFiscalYearQuarter().prevYear.toString(),
//       },
//       {
//         testId: "material_change_quarter",
//         value: safeHelp_getFiscalYearQuarter().quarter.toString(),
//       },
//       {
//         testId: "last_report_date",
//         value: safeHelp_getFiscalYearQuarter().lastDayOfPrevQuarter.toString(),
//       },
//     ]);
//   });

//   // ensurePageClosedAfterEach(test);

//   // test("Option 2", async ({
//   //   page,
//   //   // context
//   // }, testInfo) => {
//   //   // await createSpoofedSessionCookie(context);
//   //   await Help_createNewApplication(testInfo, page);
//   //   await Help_validateSFLLLv20Form(testInfo, page);
//   // });
// });
