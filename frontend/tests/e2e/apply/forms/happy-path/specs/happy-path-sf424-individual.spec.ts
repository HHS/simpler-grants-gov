/**
 * @feature Apply - Application Form Happy Path
 * @featureFile e2e/apply/forms/happy-path/features/happy-path-forms.feature
 * @scenario Application form completion happy path - SF-424 Individual (Generated)
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SF424_INDIVIDUAL_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/sf424-individual-data";
import { SF424_INDIVIDUAL_FORM_CONFIG } from "tests/e2e/apply/fixtures/sf424-individual-field-definitions";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;

const OPPORTUNITY_URL = `/opportunity/${SF424_INDIVIDUAL_GENERATED_OPPORTUNITY_DATA.opportunityId}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

test(
  "Application form completion happy path - SF-424 Individual (Generated)",
  { tag: [APPLY_FORMS, FULL_REGRESSION] },
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
     * (includes modal interaction, applicant selection, and application creation).
     * Apply as an individual, since the form is for individual applicants.
     */
    await createApplication(page, OPPORTUNITY_URL);

    // When the user clicks on a form link
    // Then the form opens
    // And the user fills out the form with valid test data
    // And the user clicks Save
    await fillForm(
      testInfo,
      page,
      SF424_INDIVIDUAL_FORM_CONFIG,
      SF424_INDIVIDUAL_GENERATED_OPPORTUNITY_DATA.buildTestData(Date.now()),
      false,
    );

    /* Covers "Form status validation" flow in the feature file,
     * which includes verification of the status in form and application landing page after saving a completed form.
     */
    await verifyFormStatusAfterSave(page, "complete");
  },
);
