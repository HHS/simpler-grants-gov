import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import { buildPrintUrl } from "tests/e2e/utils/submission/print-view-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

for (const orgLabel of [undefined, playwrightEnv.testOrgLabel]) {
  test(
    `NSF Deviation save, clear, print and submit (${orgLabel ? "organization" : "individual"})`,
    { tag: [VALID_TAGS.APPLY_FORMS, VALID_TAGS.FULL_REGRESSION] },
    async ({ page, context }, testInfo) => {
      skipNonChromeOnStaging(testInfo);
      test.setTimeout(300_000);
      await authenticateE2eUser(
        page,
        context,
        /mobile/i.test(testInfo.project.name),
      );
      await createApplication(
        page,
        "/opportunity/6d58e0cb-9b08-5732-b4a5-4df7f8cedfa7",
        orgLabel,
      );
      const applicationUrl = page.url();
      await openForm(page, "NSF Deviation Authorization");
      const field = page.getByRole("textbox", {
        name: "Deviation authorization information",
      });
      const value =
        "Authorized deviation & scope <A>.\nContact the program officer.";
      await field.fill(value);
      await saveForm(page);
      await page.reload();
      await expect(field).toHaveValue(value);
      await field.fill("");
      await saveForm(page);
      await page.reload();
      await expect(field).toHaveValue("");
      await field.fill(value);
      await saveForm(page);
      await page.goto(buildPrintUrl(page.url()));
      await expect(page.getByText(value, { exact: false })).toBeVisible();
      await page.goto(applicationUrl);
      await submitApplicationAndVerify(page, "success");
      await verifySubmissionConfirmation(page);
    },
  );
}
