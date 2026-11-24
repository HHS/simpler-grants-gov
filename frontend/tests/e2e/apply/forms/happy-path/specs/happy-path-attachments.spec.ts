/**
 * @feature Apply - Application Form Happy Path
 * @featureFile e2e/apply/forms/happy-path/features/happy-path-forms.feature
 * @scenario Application form completion happy path - Attachments
 */

import { test } from "@playwright/test";
import { ATTACHMENT_OPPORTUNITIES } from "tests/e2e/apply/fixtures/attachment-data";
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
import { loadOpportunityConfig } from "tests/e2e/utils/submission/load-opportunity-config";
import { buildHappyPathTestData } from "tests/e2e/utils/submission/print-view-utils";

for (const { variant, opportunityNumber } of ATTACHMENT_OPPORTUNITIES) {
  const opportunity = loadOpportunityConfig(opportunityNumber);
  const [form] = opportunity.forms;

  test(
    `Application form completion happy path - Attachments (${variant})`,
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
        opportunity.opportunityUrl,
        playwrightEnv.testOrgLabel,
      );
      const applicationUrl = page.url();
      await fillForm(
        testInfo,
        page,
        form.formConfig,
        buildHappyPathTestData(form, Date.now()),
        false,
      );
      await verifyFormStatusAfterSave(page, "complete");
      await verifyFormStatusOnApplication(
        page,
        "complete",
        form.formConfig.formName,
        applicationUrl,
      );
    },
  );
}
