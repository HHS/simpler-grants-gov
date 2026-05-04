/**
 * @feature Apply - Application Form Failure Path
 * @featureFile e2e/apply/forms/failure-path/features/failure-path-forms.feature
 * @scenario Application form completion failure path - sf424a
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  SF424A_ALERT_ERRORS,
  SF424A_FORM_MATCHER,
  SF424A_REQUIRED_FIELD_ERRORS,
} from "tests/e2e/apply/fixtures/sf424a-field-definitions";
import {
  testdata_local_environment,
  testdata_staging_environment,
} from "tests/e2e/opportunity-id-data";
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
const OPPORTUNITY_ID =
  targetEnv === "staging"
    ? testdata_staging_environment.opportunityID
    : testdata_local_environment.opportunityID;
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

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
  "SF-424A error validation - required fields and inline errors",
  { tag: [APPLY, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    // Given the user is logged in
    await authenticateE2eUser(page, context, !!isMobile);

    // And the user starts a new application
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    const applicationUrl = page.url();

    // And the user opens the SF-424A form
    const openedSf424aForValidation = await openForm(page, SF424A_FORM_MATCHER);
    if (!openedSf424aForValidation) {
      throw new Error(
        "Could not find or open SF-424A form link on the application forms page",
      );
    }

    // When the user clicks Save without entering required values
    await saveForm(page, true);

    // Then required field validation errors are shown and status remains incomplete
    await verifyFormStatusAfterSave(
      page,
      "incomplete",
      SF424A_REQUIRED_FIELD_ERRORS,
      SF424A_ALERT_ERRORS,
    );

    // And the application form row shows an incomplete status
    await verifyFormStatusOnApplication(
      page,
      "incomplete",
      SF424A_FORM_MATCHER,
      applicationUrl,
    );
  },
);
