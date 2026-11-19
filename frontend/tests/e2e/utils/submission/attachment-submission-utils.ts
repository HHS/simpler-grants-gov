import path from "node:path";
import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";

import { loadOpportunityConfig } from "./load-opportunity-config";
import {
  buildHappyPathTestData,
  buildPrintUrl,
  validateAllPrintViews,
  validateAttachmentPrintViewSection,
} from "./print-view-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "./submit-application-utils";

export function testAttachmentSubmissionAndPrint({
  formLabel,
  opportunityNumber,
  attachmentField,
  attachmentSectionId,
}: {
  formLabel: string;
  opportunityNumber: string;
  attachmentField: string;
  attachmentSectionId: string;
}) {
  const { opportunityUrl, forms } = loadOpportunityConfig(opportunityNumber);
  if (forms.length !== 1) {
    throw new Error(`Expected one form for ${opportunityNumber}`);
  }
  const [form] = forms;

  for (const [applicant, orgLabel] of [
    ["organization", playwrightEnv.testOrgLabel],
    ["individual", undefined],
  ] as const) {
    test(
      `${formLabel} submission and print view (${applicant})`,
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
        const { [attachmentField]: filePath, ...printableData } = testData;
        expect(filePath, "An attachment fixture is required").toBeTruthy();

        await fillForm(testInfo, page, form.formConfig, testData, false);
        await verifyFormStatusAfterSave(page, "complete");
        const formUrl = page.url();
        await page.reload();
        await expect(
          page.getByText(path.basename(filePath), { exact: true }),
        ).toBeVisible();
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
            testData: printableData,
            printUrl: buildPrintUrl(formUrl),
            expectedPrepopulatedFields: form.expectedPrepopulatedFields,
            userEnteredFieldTestIds: form.userEnteredFieldTestIds,
          },
        ]);
        // The upload control is absent in print view. Check the printed filename.
        await validateAttachmentPrintViewSection(
          page,
          attachmentSectionId,
          filePath,
        );
      },
    );
  }
}
