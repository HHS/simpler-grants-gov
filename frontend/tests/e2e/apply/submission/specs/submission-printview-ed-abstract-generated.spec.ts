import path from "node:path";
import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";
import {
  assertPrintViewIsReadOnly,
  buildPrintUrl,
  navigateToPrintView,
} from "tests/e2e/utils/submission/print-view-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;
const opportunity = "/opportunity/ea981400-e64a-4d17-a337-5b26b15f43cd";
const config = {
  ...FORM_DEFAULTS,
  formName: "ED Abstract Form",
  fields: {
    attachment: {
      testId: "file-input-input",
      field: "Attachment",
      type: "file",
    },
  },
} as const;
const data = {
  attachment: path.resolve("tests/e2e/test-upload-files/sample-upload-kb.pdf"),
};
const filename = path.basename(data.attachment);

for (const [applicant, organization] of [
  ["individual", undefined],
  ["organization", playwrightEnv.testOrgLabel],
] as const) {
  test(
    "ED Abstract Form generated form submission and print view (" +
      applicant +
      ")",
    { tag: [APPLY_FORMS, FULL_REGRESSION] },
    async ({ page, context }, testInfo) => {
      skipNonChromeOnStaging(testInfo);
      test.setTimeout(300_000);
      await authenticateE2eUser(
        page,
        context,
        /mobile/i.test(testInfo.project.name),
      );
      await createApplication(page, opportunity, organization);
      const applicationUrl = page.url();
      expect(await openForm(page, /^ED Abstract Form$/i)).toBe(true);
      await expect(
        page.getByText(/An abstract is to be submitted in accordance/),
      ).toBeVisible();
      await expect(
        page.getByText(/You must attach one and only one file/),
      ).toBeVisible();
      await saveForm(page, true);
      await page.goto(applicationUrl);
      await fillForm(testInfo, page, config, data, false);
      await verifyFormStatusAfterSave(page, "complete");
      const formUrl = page.url();
      await page.reload();
      await expect(page.getByText(filename, { exact: true })).toBeVisible();
      await page.goto(applicationUrl);
      await submitApplicationAndVerify(page, "success");
      await verifySubmissionConfirmation(page);
      await navigateToPrintView(page, buildPrintUrl(formUrl));
      await assertPrintViewIsReadOnly(page);
      await expect(
        page.getByRole("heading", {
          name: "ED Abstract Form",
          exact: true,
          level: 1,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Abstract", exact: true }),
      ).toBeVisible();
      await expect(page.getByText(filename, { exact: true })).toBeVisible();
    },
  );
}
