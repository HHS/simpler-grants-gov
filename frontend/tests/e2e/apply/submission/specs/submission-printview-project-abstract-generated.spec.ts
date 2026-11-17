import path from "node:path";
import { expect, test } from "@playwright/test";
import { PROJECT_ABSTRACT_FORM_CONFIG } from "tests/e2e/apply/fixtures/project-abstract-field-definitions";
import { projectAbstractHappyPathTestData } from "tests/e2e/apply/fixtures/project-abstract-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
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
const opportunity = "/opportunity/2e5d8bcd-bf18-449e-809c-15d21de7a22f";
const config = PROJECT_ABSTRACT_FORM_CONFIG;
const data = projectAbstractHappyPathTestData;
const filename = path.basename(data.attachment);

for (const [applicant, organization] of [
  ["individual", undefined],
  ["organization", playwrightEnv.testOrgLabel],
] as const) {
  test(
    "Project Abstract generated form submission and print view (" +
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
          name: "Project Abstract",
          exact: true,
          level: 1,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: "Project Abstract File",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByText(filename, { exact: true })).toBeVisible();
    },
  );
}
