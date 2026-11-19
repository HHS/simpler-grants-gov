/**
 * @feature Apply - Application Form Failure Path
 * @featureFile tests/e2e/apply/forms/failure-path/features/failure-path-forms.feature
 * @scenario Application form completion failure path - ed-abstract
 */

import { expect, test } from "@playwright/test";
import { ED_ABSTRACT_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/ed-abstract-form-data";
import {
  ED_ABSTRACT_FORM_MATCHER,
  ED_ABSTRACT_REQUIRED_FIELD_ERRORS,
} from "tests/e2e/apply/fixtures/ed-abstract-form-field-definitions";
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

const opportunityUrl = `/opportunity/${ED_ABSTRACT_GENERATED_OPPORTUNITY_DATA.opportunityId}`;

test(
  "ED Abstract Form - error validation on empty save",
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

    expect(await openForm(page, ED_ABSTRACT_FORM_MATCHER)).toBe(true);
    await expect(
      page.getByText(/An abstract is to be submitted in accordance/),
    ).toBeVisible();
    await expect(
      page.getByText(/You must attach one and only one file/),
    ).toBeVisible();

    await saveForm(page, true);
    await verifyFormStatusAfterSave(
      page,
      "incomplete",
      ED_ABSTRACT_REQUIRED_FIELD_ERRORS,
    );
    await verifyFormStatusOnApplication(
      page,
      "incomplete",
      ED_ABSTRACT_FORM_MATCHER,
      applicationUrl,
    );
  },
);
