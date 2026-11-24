import { expect, test } from "@playwright/test";
import { NSF_SUGGESTED_REVIEWERS_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/nsf-suggested-reviewers-data";
import { NSF_SUGGESTED_REVIEWERS_FORM_CONFIG } from "tests/e2e/apply/fixtures/nsf-suggested-reviewers-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
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
  NSF_SUGGESTED_REVIEWERS_OPPORTUNITY_DATA.opportunityNumber,
);
const { fields } = NSF_SUGGESTED_REVIEWERS_FORM_CONFIG;

for (const [applicant, orgLabel] of [
  ["organization", playwrightEnv.testOrgLabel],
  ["individual", undefined],
] as const) {
  test.fixme(
    `NSF Suggested Reviewers save, clear, print and submit (${applicant})`,
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
      const suggested = page.locator(fields.suggestedReviewers.selector);
      const notToInclude = page.locator(fields.reviewersNotToInclude.selector);

      // Both answers are optional, so an empty form saves as complete.
      expect(await openForm(page, form.formConfig.formName)).toBe(true);
      await saveForm(page);
      await verifyFormStatusAfterSave(page, "complete");
      // Reload to clear the saved message, so the next saveForm waits for its own save.
      await page.reload();

      await suggested.fill("Dr. Ada Example");
      await notToInclude.fill("Dr. Ben Example");
      await saveForm(page);
      await page.reload();
      await expect(suggested).toHaveValue("Dr. Ada Example");
      await expect(notToInclude).toHaveValue("Dr. Ben Example");

      await suggested.fill("");
      await notToInclude.fill("");
      await saveForm(page);
      await verifyFormStatusAfterSave(page, "complete");
      await page.reload();
      await expect(suggested).toHaveValue("");
      await expect(notToInclude).toHaveValue("");

      await page.goto(applicationUrl);
      const testData = buildHappyPathTestData(form, Date.now());
      await fillForm(testInfo, page, form.formConfig, testData, false);
      await verifyFormStatusAfterSave(page, "complete");
      const formUrl = page.url();
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
