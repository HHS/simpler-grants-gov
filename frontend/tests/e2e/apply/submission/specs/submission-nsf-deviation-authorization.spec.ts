import { expect, test } from "@playwright/test";
import { NSF_DEVIATION_AUTHORIZATION_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/nsf-deviation-authorization-data";
import { NSF_DEVIATION_AUTHORIZATION_FORM_CONFIG } from "tests/e2e/apply/fixtures/nsf-deviation-authorization-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";
import { loadOpportunityConfig } from "tests/e2e/utils/submission/load-opportunity-config";
import {
  buildHappyPathTestData,
  buildPrintUrl,
  validateAllPrintViews,
} from "tests/e2e/utils/submission/print-view-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const {
  opportunityUrl,
  forms: [form],
} = loadOpportunityConfig(
  NSF_DEVIATION_AUTHORIZATION_OPPORTUNITY_DATA.opportunityNumber,
);

for (const [applicant, orgLabel] of [
  ["organization", playwrightEnv.testOrgLabel],
  ["individual", undefined],
] as const) {
  // FIXME: Save/Clear inconsistency after reload (#13105).
  test.fixme(
    `NSF Deviation save, clear, print and submit (${applicant})`,
    { tag: [VALID_TAGS.APPLY_FORMS, VALID_TAGS.FULL_REGRESSION] },
    async ({ page, context }, testInfo) => {
      skipNonChromeOnStaging(testInfo);
      test.setTimeout(300_000);
      await authenticateE2eUser(
        page,
        context,
        /mobile/i.test(testInfo.project.name),
      );
      await createApplication(page, opportunityUrl, orgLabel);
      const applicationUrl = page.url();
      const testData = buildHappyPathTestData(form, Date.now());

      await fillForm(testInfo, page, form.formConfig, testData, false);
      await verifyFormStatusAfterSave(page, "complete");
      const formUrl = page.url();
      const field = page.getByTestId(
        NSF_DEVIATION_AUTHORIZATION_FORM_CONFIG.fields.deviationAuthorization
          .testId,
      );
      const value = testData.deviationAuthorization;
      await page.reload();
      await expect(field).toHaveValue(value);

      await field.fill("");
      await saveForm(page);
      await verifyFormStatusAfterSave(page, "complete");
      await page.reload();
      await expect(field).toHaveValue("");

      await field.fill(value);
      await saveForm(page);
      await verifyFormStatusOnApplication(
        page,
        "complete",
        form.formConfig.formName,
        applicationUrl,
      );
      await submitApplicationAndVerify(page, "success");
      await verifySubmissionConfirmation(page);
      await validateAllPrintViews(page, [
        {
          formKey: form.formKey,
          formName: form.formConfig.formName,
          testData,
          printUrl: buildPrintUrl(formUrl),
          expectedPrepopulatedFields: form.expectedPrepopulatedFields,
          userEnteredFieldTestIds: form.userEnteredFieldTestIds,
        },
      ]);
    },
  );
}
