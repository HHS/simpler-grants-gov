/**
 * @feature Apply - Application Form Failure Path
 * @featureFile tests/e2e/apply/forms/failure-path/features/failure-path-forms.feature
 * @scenario Application form completion failure path - phs-research-training
 */

import { expect, test } from "@playwright/test";
import { PHS_RESEARCH_TRAINING_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/phs-research-training-data";
import {
  PHS_RESEARCH_TRAINING_FORM_MATCHER,
  PHS_RESEARCH_TRAINING_REQUIRED_FIELD_ERRORS,
} from "tests/e2e/apply/fixtures/phs-research-training-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;
const { testOrgLabel } = playwrightEnv;

const opportunityUrl = `/opportunity/${PHS_RESEARCH_TRAINING_GENERATED_OPPORTUNITY_DATA.opportunityId}`;

test(
  "PHS 398 Research Training Program Plan - error validation on empty save",
  { tag: [APPLY_FORMS, FULL_REGRESSION] },
  async ({ page, context }, testInfo) => {
    skipNonChromeOnStaging(testInfo);
    test.setTimeout(300_000);

    await authenticateE2eUser(
      page,
      context,
      /mobile/i.test(testInfo.project.name),
    );
    await createApplication(page, opportunityUrl, testOrgLabel);
    const applicationUrl = page.url();

    expect(await openForm(page, PHS_RESEARCH_TRAINING_FORM_MATCHER)).toBe(true);
    await saveForm(page, true);
    await verifyFormStatusAfterSave(
      page,
      "incomplete",
      PHS_RESEARCH_TRAINING_REQUIRED_FIELD_ERRORS,
    );
    await verifyFormStatusOnApplication(
      page,
      "incomplete",
      PHS_RESEARCH_TRAINING_FORM_MATCHER,
      applicationUrl,
    );
  },
);
