/**
 * @feature Apply - Application Form Happy Path
 * @featureFile e2e/apply/forms/happy-path/features/happy-path-forms.feature
 * @scenario Application form completion happy path - SBIR/STTR Information (Generated)
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SBIR_STTR_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/sbir-sttr-information-data";
import { SBIR_STTR_FORM_CONFIG } from "tests/e2e/apply/fixtures/sbir-sttr-information-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { fillField } from "tests/e2e/utils/fields/fill-fields";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;
const { testOrgLabel } = playwrightEnv;

const OPPORTUNITY_URL = `/opportunity/${SBIR_STTR_GENERATED_OPPORTUNITY_DATA.opportunityId}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

test(
  "Application form completion happy path - SBIR/STTR Information (Generated)",
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
     * (includes modal interaction, organization selection, and application creation)
     */
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);

    // When the user clicks on a form link
    // Then the form opens
    // And the user fills out the form with valid test data
    // And the user clicks Save
    await fillForm(
      testInfo,
      page,
      SBIR_STTR_FORM_CONFIG,
      SBIR_STTR_GENERATED_OPPORTUNITY_DATA.buildTestData(Date.now()),
      false,
    );

    /* Covers "Form status validation" flow in the feature file,
     * which includes verification of the status in form and application landing page after saving a completed form.
     */
    await verifyFormStatusAfterSave(page, "complete");
    await page.reload();
    await expect(page.locator("#sbc_control_id")).toHaveValue("001234567");
    await expect(page.locator("#program_type")).toHaveValue("SBIR");
    await expect(
      page.locator('input[name="faculty_or_student_owned"][value="false"]'),
    ).toBeChecked();

    await fillField(
      page,
      {
        ...SBIR_STTR_FORM_CONFIG.fields.phase_ii_awards_received,
        selector: 'input[name="phase_ii_awards_received"][value="true"]',
      },
      true,
    );
    const history = page.locator("#commercialization_history-visible");
    await expect(history).toBeEnabled();
    await page.locator("#program_type").selectOption("STTR");
    await expect(history).toHaveCount(0);
  },
);
