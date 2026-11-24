/**
 * @feature Apply - Application Form Happy Path
 * @featureFile e2e/apply/forms/happy-path/features/happy-path-forms.feature
 * @scenario Application form completion happy path - SF-424
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SF424_OPPORTUNITIES } from "tests/e2e/apply/fixtures/sf424-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";
import { scenariosForEachForm } from "tests/e2e/utils/submission/scenarios-for-each-form";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;
const { testOrgLabel } = playwrightEnv;

const scenarios = scenariosForEachForm(SF424_OPPORTUNITIES, [
  { testName: "Application form completion happy path" },
] as const);

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

for (const { testName, opportunityConfig, form } of scenarios) {
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

      // And the user has started an application for an opportunity with the form
      await createApplication(
        page,
        opportunityConfig.opportunityUrl,
        testOrgLabel,
      );

      // When the user opens the form, fills it out with valid test data and saves
      await fillForm(
        testInfo,
        page,
        form.formConfig,
        form.buildTestData(Date.now()),
        false,
      );

      // Then the form saves as complete
      await verifyFormStatusAfterSave(page, "complete");
    },
  );
}
