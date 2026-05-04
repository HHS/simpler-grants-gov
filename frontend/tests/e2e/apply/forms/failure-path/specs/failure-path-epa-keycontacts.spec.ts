/**
 * @feature Apply - Application Form Failure Path
 * @featureFile e2e/apply/forms/failure-path/specs/failure-path-forms.feature
 * @scenario Application form completion failure path - epa-keycontacts
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { fillFormPartial } from "tests/e2e/utils/forms/general-forms-filling";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";

import {
  EPA_KEY_CONTACTS_FORM_MATCHER,
  EPA_KEY_CONTACTS_REQUIRED_FIELD_ERRORS,
  fieldDefinitionsEPAKeyContacts,
} from "../../../fixtures/epa-key-contacts-field-definitions";
import { epaKeyContactsFailurePathTestData } from "../../../fixtures/epa-key-contacts-fill-data";

const { APPLY, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel, targetEnv } = playwrightEnv;

// Environment-specific opportunity IDs
// Staging: 39cf0a5c-5fed-40b4-8f46-5374101ae419
// Local:   c3c59562-a54f-4203-b0f6-98f2f0383481
const OPPORTUNITY_ID =
  targetEnv === "staging"
    ? "39cf0a5c-5fed-40b4-8f46-5374101ae419"
    : "c3c59562-a54f-4203-b0f6-98f2f0383481";
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  if (targetEnv === "staging") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
    );
  }
});

test(
  "EPA Key Contacts Form - error validation with prefix-only data",
  { tag: [APPLY, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    // Given the user is logged in
    await authenticateE2eUser(page, context, !!isMobile);

    // And the user starts a new application
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    const applicationUrl = page.url();

    // And the user opens the EPA Key Contacts form
    const opened = await openForm(page, EPA_KEY_CONTACTS_FORM_MATCHER);
    if (!opened) {
      throw new Error(
        "Could not find or open EPA Key Contacts form link on the application forms page",
      );
    }

    // And the user fills only partial data to trigger required-field validation
    await fillFormPartial(
      testInfo,
      page,
      fieldDefinitionsEPAKeyContacts,
      epaKeyContactsFailurePathTestData,
    );

    // When the user clicks Save with missing required values
    await saveForm(page, true);

    // Then required field validation errors are shown and status remains incomplete
    await verifyFormStatusAfterSave(
      page,
      "incomplete",
      EPA_KEY_CONTACTS_REQUIRED_FIELD_ERRORS,
    );

    // And the application form row shows an incomplete status
    await verifyFormStatusOnApplication(
      page,
      "incomplete",
      EPA_KEY_CONTACTS_FORM_MATCHER,
      applicationUrl,
    );
  },
);
