// // ---- Imports ----
// import { test, expect } from '@playwright/test';
// import testConfig from '../../test-data/test-config.json' with { type: 'json' };
// import {
//   safeHelp_safeExpect,
//   safeHelp_safeStep,
//   safeHelp_attachTestSummary,
//   safeHelp_updateApplicationName,
//   safeHelp_GotoForm,
//   safeHelp_selectDropdownLocator,
//   safeHelp_fillFieldsByTestId,
//   safeHelp_ValidateTextAtLocator,
//   safeHelp_safeGoto,
//   safeHelp_safeWaitForLoadState,
//   safeHelp_clickLink,
//   safeHelp_clickButton,
// } from '../../helpers/safeHelp';

// // ---- Environment Configuration ----
// const BASE_DOMAIN = testConfig.environment.baseDomain;
// const APPLICATION_ID = testConfig.environment.applicationId;
// const directPageUrl = `https://${BASE_DOMAIN}/applications/${APPLICATION_ID}`;

// // ============================================================================
// // Main Test
// // ============================================================================
// test('Test global setup', async ({ page }, testInfo) => {
//   const startTime = new Date();
//   const goToFormResult = safeHelp_GotoForm(testInfo, page);

//   try {
//     // ---- Navigate to Application ----
//     await safeHelp_safeGoto(testInfo, page, directPageUrl);
//     await page.getByRole('link', { name: 'Sign in' }).click();

//     // ---- Update Application Name ----
//     const { appLinkName, prevYear, quarter, lastDayOfPrevQuarter } = await safeHelp_updateApplicationName(
//       testInfo,
//       page
//     );
//   } catch (error) {
//     const errorMsg = String(error);
//     testInfo.annotations.push({
//       type: 'test-error',
//       description: errorMsg,
//     });
//     await testInfo.attach('test-error', {
//       body: errorMsg,
//       contentType: 'text/plain',
//     });
//     console.log(`❌ ${errorMsg}`);
//   } finally {
//     await safeHelp_attachTestSummary(testInfo, 0, startTime);
//   }
// });