/**
 * @feature Apply - Application Form Failure Path
 * @featureFile tests/e2e/apply/forms/failure-path/features/failure-path-forms.feature
 * @scenario Application form completion failure path - nasa-pi-and-aor
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { NASA_PI_AND_AOR_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/nasa-pi-and-aor-data";
import {
  NASA_PI_AND_AOR_FORM_MATCHER,
  NASA_PI_AND_AOR_REQUIRED_FIELD_ERRORS,
} from "tests/e2e/apply/fixtures/nasa-pi-and-aor-field-definitions";
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
const OPPORTUNITY_URL = `/opportunity/${NASA_PI_AND_AOR_GENERATED_OPPORTUNITY_DATA.opportunityId}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

test(
  "NASA PI and AOR (Generated) - error validation on empty save",
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
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    const applicationUrl = page.url();

    // And the Application landing page loads with the "NASA PI and AOR (Generated)" form link visible
    // And the user clicks on a form link
    // Then the form opens
    const opened = await openForm(page, NASA_PI_AND_AOR_FORM_MATCHER);
    if (!opened) {
      throw new Error(
        "Could not find or open NASA PI and AOR (Generated) form link on the application forms page",
      );
    }

    // When the user attempts to save with required fields left empty
    await saveForm(page, true);

    // Then required field validation errors are shown on the form
    await verifyFormStatusAfterSave(
      page,
      "incomplete",
      NASA_PI_AND_AOR_REQUIRED_FIELD_ERRORS,
    );

    // When the user navigates back to the application landing page
    // Then under the "NASA PI and AOR (Generated)" form the status shows "Some issues found. Check your entries."
    await verifyFormStatusOnApplication(
      page,
      "incomplete",
      NASA_PI_AND_AOR_FORM_MATCHER,
      applicationUrl,
    );
  },
);
