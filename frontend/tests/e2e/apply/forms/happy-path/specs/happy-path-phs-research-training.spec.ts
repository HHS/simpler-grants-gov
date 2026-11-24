/**
 * @feature Apply - Application Form Happy Path
 * @featureFile e2e/apply/forms/happy-path/features/happy-path-forms.feature
 * @scenario Application form completion happy path - PHS 398 Research Training Program Plan
 */

import { test } from "@playwright/test";
import { PHS_RESEARCH_TRAINING_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/phs-research-training-data";
import { PHS_RESEARCH_TRAINING_FORM_CONFIG } from "tests/e2e/apply/fixtures/phs-research-training-field-definitions";
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

const opportunity = PHS_RESEARCH_TRAINING_GENERATED_OPPORTUNITY_DATA;

test(
  "Application form completion happy path - PHS 398 Research Training Program Plan",
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
      `/opportunity/${opportunity.opportunityId}`,
      playwrightEnv.testOrgLabel,
    );
    const applicationUrl = page.url();
    await fillForm(
      testInfo,
      page,
      PHS_RESEARCH_TRAINING_FORM_CONFIG,
      opportunity.buildTestData(Date.now()),
      false,
    );
    await verifyFormStatusAfterSave(page, "complete");
    await verifyFormStatusOnApplication(
      page,
      "complete",
      PHS_RESEARCH_TRAINING_FORM_CONFIG.formName,
      applicationUrl,
    );
  },
);
