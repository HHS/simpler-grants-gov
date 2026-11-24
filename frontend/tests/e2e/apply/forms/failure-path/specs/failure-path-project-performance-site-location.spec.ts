/**
 * @feature Apply - Application Form Failure Path
 * @featureFile tests/e2e/apply/forms/failure-path/features/failure-path-forms.feature
 * @scenario Application form completion failure path - project-performance-site-location
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { PPSL_OPPORTUNITIES } from "tests/e2e/apply/fixtures/project-performance-site-location-data";
import {
  PPSL_FORM_MATCHER,
  PPSL_REQUIRED_FIELD_ERRORS,
} from "tests/e2e/apply/fixtures/project-performance-site-location-field-definitions";
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
import { loadOpportunityConfig } from "tests/e2e/utils/submission/load-opportunity-config";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;
const { testOrgLabel } = playwrightEnv;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

for (const { formLabel, opportunityNumber } of PPSL_OPPORTUNITIES) {
  const { opportunityUrl } = loadOpportunityConfig(opportunityNumber);

  test(
    `${formLabel} - error validation on empty save`,
    { tag: [APPLY_FORMS, FULL_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000); // 5 min timeout

      const isMobile = testInfo.project.name.match(/[Mm]obile/);

      // Given the user is logged in
      await authenticateE2eUser(page, context, !!isMobile);

      // And the user has started an application for an opportunity with the form
      await createApplication(page, opportunityUrl, testOrgLabel);
      const applicationUrl = page.url();

      // When the user opens the "PROJECT/PERFORMANCE SITE LOCATION(S)" form
      const opened = await openForm(page, PPSL_FORM_MATCHER);
      if (!opened) {
        throw new Error(
          "Could not find or open PROJECT/PERFORMANCE SITE LOCATION(S) form link on the application forms page",
        );
      }

      // And the user saves with required fields left empty
      await saveForm(page, true); // expect validation errors

      // Then required field validation errors are shown on the form
      await verifyFormStatusAfterSave(
        page,
        "incomplete",
        PPSL_REQUIRED_FIELD_ERRORS,
      );

      // When the user navigates back to the application landing page
      // Then under the form the status shows "Some issues found. Check your entries."
      await verifyFormStatusOnApplication(
        page,
        "incomplete",
        PPSL_FORM_MATCHER,
        applicationUrl,
      );
    },
  );
}
