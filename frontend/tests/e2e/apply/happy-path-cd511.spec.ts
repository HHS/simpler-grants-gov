/**
 * @feature Apply - Application Form Happy Path
 * @featureFile frontend/tests/e2e/apply/features/happy-path-forms.feature
 * @scenario Application form completion happy path - CD511
 */
import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { getOpportunityId } from "tests/e2e/get-opportunityId-utils";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

import { CD511_FORM_CONFIG } from "./fixtures/cd511-field-definitions";
import { cd511HappyPathTestData } from "./fixtures/cd511-fill-data";

const { APPLY, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel } = playwrightEnv;
const OPPORTUNITY_URL = `/opportunity/${getOpportunityId()}`;

test(
  "Application form completion happy path - CD511",
  { tag: [APPLY, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    // Given the user is logged in
    await authenticateE2eUser(page, context, !!isMobile);

    // Call reusable create application function from utils
    /**
     * Covers "Starting a new application" flow in the feature file
     * (includes modal interaction, organization selection, and application creation)
     */
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);

    // When the user fills out the form with valid test data
    // And the user clicks Save
    await fillForm(
      testInfo,
      page,
      CD511_FORM_CONFIG,
      cd511HappyPathTestData,
      false,
    );

    await page.waitForTimeout(2000);

    /* Covers "Form status validation" flow in the feature file,
     * which includes verification of the status in form and application landing page after saving a completed form.
     */
    await verifyFormStatusAfterSave(page, "complete");
  },
);
