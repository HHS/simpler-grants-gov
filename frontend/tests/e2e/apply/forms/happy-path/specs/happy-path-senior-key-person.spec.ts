/**
 * @feature Apply - Application Form Happy Path
 * @featureFile e2e/apply/forms/happy-path/features/happy-path-forms.feature
 * @scenario Application form completion happy path - <Senior/Key Person form>
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { RR_KEY_PERSON_FORM } from "tests/e2e/apply/fixtures/rr-key-person-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { addFieldListEntries } from "tests/e2e/utils/forms/field-list-utils";
import {
  buildFlexibleFormNameRegex,
  openForm,
} from "tests/e2e/utils/forms/form-navigation-utils";
import { fillFormPartial } from "tests/e2e/utils/forms/general-forms-filling";
import { clickSaveButton } from "tests/e2e/utils/forms/save-form-utils";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;
const { testOrgLabel } = playwrightEnv;

/** Each Senior/Key Person form generated from forms/specs. */
const SENIOR_KEY_PERSON_FORMS = [RR_KEY_PERSON_FORM];

// Skip non-Chrome browsers in staging to avoid OTP rate-limiting
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

for (const {
  formLabel,
  opportunityId,
  formConfig,
  happyPathData,
} of SENIOR_KEY_PERSON_FORMS) {
  test(
    `Application form completion happy path - ${formLabel}`,
    { tag: [APPLY_FORMS, FULL_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000); // 5 min timeout

      const isMobile = testInfo.project.name.match(/[Mm]obile/);

      // Given the user is logged in
      await authenticateE2eUser(page, context, !!isMobile);

      // And the user has started an application
      await createApplication(
        page,
        `/opportunity/${opportunityId}`,
        testOrgLabel,
      );

      // When the user opens the form
      const opened = await openForm(
        page,
        buildFlexibleFormNameRegex(formConfig.formName),
      );
      if (!opened) {
        throw new Error(`Could not open ${formLabel}`);
      }

      // And adds a senior/key person beside the PD/PI
      await addFieldListEntries(page, "senior_key_persons", 1);

      // And fills out both people's profiles, attaching their documents
      await fillFormPartial(testInfo, page, formConfig.fields, happyPathData);

      // And clicks Save
      await clickSaveButton(page, formConfig.saveButtonTestId);

      // Then the form saves with no errors
      await verifyFormStatusAfterSave(page, "complete");
    },
  );
}
