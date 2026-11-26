/**
 * @feature Apply - Application Form Failure Path
 * @featureFile tests/e2e/apply/forms/failure-path/features/failure-path-forms.feature
 * @scenario Application form completion failure path - sf424
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { OPPORTUNITY_ID } from "tests/e2e/apply/fixtures/general-apply-fixtures";
import { SF424_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/sf424-data";
import {
  SF424_FORM_MATCHER,
  SF424_REQUIRED_FIELD_ERRORS,
} from "tests/e2e/apply/fixtures/sf424-field-definitions";
import { SF424_GENERATED_REQUIRED_FIELD_ERRORS } from "tests/e2e/apply/fixtures/sf424-generated-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

// Each SF-424 form, with the opportunity that offers it and the errors an empty save shows.
const SF424_FORMS = [
  {
    testName: "SF-424 error validation - required fields and inline errors",
    opportunityUrl: `/opportunity/${OPPORTUNITY_ID}`,
    requiredFieldErrors: SF424_REQUIRED_FIELD_ERRORS,
  },
  {
    testName:
      "SF-424 (Generated) error validation - required fields and inline errors",
    opportunityUrl: `/opportunity/${SF424_GENERATED_OPPORTUNITY_DATA.opportunityId}`,
    requiredFieldErrors: SF424_GENERATED_REQUIRED_FIELD_ERRORS,
  },
] as const;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

for (const { testName, opportunityUrl, requiredFieldErrors } of SF424_FORMS) {
  test(
    testName,
    { tag: [APPLY_FORMS, FULL_REGRESSION] },
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
      await createApplication(page, opportunityUrl, testOrgLabel);
      const applicationUrl = page.url();

      // And the Application landing page loads with the "Application for Federal Assistance (SF-424)" form link visible
      // And the user clicks on a form link
      // Then the form opens
      const opened = await openForm(page, SF424_FORM_MATCHER);
      if (!opened) {
        throw new Error(
          "Could not find or open SF-424 form link on the application forms page",
        );
      }

      // Wait for form content to be fully rendered and interactive
      // Check for form heading to ensure the form is ready
      await page
        .getByText(SF424_FORM_MATCHER, { exact: false })
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      // When the user attempts to save with required fields left empty
      await saveForm(page, true);

      // Then required field validation errors are shown on the form
      await verifyFormStatusAfterSave(page, "incomplete", requiredFieldErrors);

      // When the user navigates back to the application landing page
      // Then under the "Application for Federal Assistance (SF-424)" form the status shows "Some issues found. Check your entries."
      await verifyFormStatusOnApplication(
        page,
        "incomplete",
        SF424_FORM_MATCHER,
        applicationUrl,
      );
    },
  );
}
