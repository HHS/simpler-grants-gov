/**
 * @feature Apply - Application Form Failure Path
 * @featureFile tests/e2e/apply/forms/failure-path/features/negative-path-forms.feature
 * @scenario Application form completion failure path - project-abstract-summary
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  PROJECT_ABSTRACT_SUMMARY_FORM_MATCHER,
  PROJECT_ABSTRACT_SUMMARY_REQUIRED_FIELD_ERRORS,
} from "tests/e2e/apply/fixtures/project-abstract-summary-field-definitions";
import { getOpportunityId } from "tests/e2e/get-opportunityId-utils";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";

const { APPLY, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel, targetEnv } = playwrightEnv;
const OPPORTUNITY_URL = `/opportunity/${getOpportunityId()}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  if (targetEnv === "staging") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
    );
  }
});

test(
  "Project Abstract Summary - error validation on empty save",
  { tag: [APPLY, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    // Given the user is logged in
    await authenticateE2eUser(page, context, !!isMobile);

    // And the user launches the URL for an opportunity with an open competition
    // When the user clicks "Start Application" in the opportunity page
    // Then the "Start a new application" modal opens
    // When the user selects the test organization in the "Who's applying" dropdown
    // And the user enters the application name
    // And the user clicks "Create Application"
    // Then a new application is created
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    const applicationUrl = page.url();

    // And the Application landing page loads with the "Project Abstract Summary" form link visible
    // And the user clicks on a form link
    // Then the form opens
    const opened = await openForm(page, PROJECT_ABSTRACT_SUMMARY_FORM_MATCHER);
    if (!opened) {
      throw new Error(
        "Could not find or open Project Abstract Summary form link on the application forms page",
      );
    }

    // When the user attempts to save with required fields left empty
    await saveForm(page, true);

    // Then required field validation errors are shown on the form
    await verifyFormStatusAfterSave(
      page,
      "incomplete",
      PROJECT_ABSTRACT_SUMMARY_REQUIRED_FIELD_ERRORS,
    );

    // When the user navigates back to the application landing page
    // Then under the "Project Abstract Summary" form the status shows "Some issues found. Check your entries."
    await verifyFormStatusOnApplication(
      page,
      "incomplete",
      PROJECT_ABSTRACT_SUMMARY_FORM_MATCHER,
      applicationUrl,
    );
  },
);
