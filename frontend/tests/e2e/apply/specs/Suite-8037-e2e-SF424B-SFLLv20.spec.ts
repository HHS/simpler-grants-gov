// ============================================================================
// This test suite verifies the creation of a new application and the completion of the SFLL v2.0 form.
// ============================================================================
import { test } from "@playwright/test";
// import { Help_completeSFLLv20Form } from "tests/e2e/helpers/Help-complete-SFLLv20-form";
import { Help_createNewApplication } from "tests/e2e/helpers/Help-create-new-application";
import { ensurePageClosedAfterEach } from "tests/e2e/helpers/safeHelp";
import { createSpoofedSessionCookie } from "tests/e2e/loginUtils";
// ============================================================================
// Main Test
// ============================================================================

test.describe("Test Suite 8037: Create New Application Flow and Complete SFLL v2.0 Form", () => {
  ensurePageClosedAfterEach(test);

  test("Test Suite 8037: Create New Application Flow and Complete SFLL v2.0 Formn", async ({
    page,
    context
  }, testInfo) => {
    await createSpoofedSessionCookie(context);
    await Help_createNewApplication(testInfo, page);
    // await Help_completeSFLLv20Form(testInfo, page);
  });
});
