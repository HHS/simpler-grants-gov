/**
 * @feature Apply - Happy Path - Senior/Key Person Profile Submission and Print View Workflow
 * @scenario Complete the Senior/Key Person Profile Submission and Print View workflow for an <user type> user
 */

import path from "path";
import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SENIOR_KEY_PERSON_OPPORTUNITIES } from "tests/e2e/apply/fixtures/senior-key-person-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { addFieldListEntries } from "tests/e2e/utils/forms/field-list-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { fillFormPartial } from "tests/e2e/utils/forms/general-forms-filling";
import { clickSaveButton } from "tests/e2e/utils/forms/save-form-utils";
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

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

// Each person's documents print in the section that holds their profile.
const ATTACHMENT_SECTION_IDS = {
  principal_investigator: "form-section-pd-pi-profile",
  "senior_key_persons[0]": "form-section-senior-key-person-profiles",
};

const applicantScenarios = SENIOR_KEY_PERSON_OPPORTUNITIES.flatMap(
  ({ formLabel, opportunityNumber, formMatcher }) => {
    const {
      opportunityUrl,
      forms: [form],
    } = loadOpportunityConfig(opportunityNumber);
    return [
      {
        testName: `Complete the ${formLabel} Submission and Print View workflow for an Organization user`,
        orgLabel: testOrgLabel,
        opportunityUrl,
        form,
        formMatcher,
      },
      {
        testName: `Complete the ${formLabel} Submission and Print View workflow for an Individual user`,
        orgLabel: undefined,
        opportunityUrl,
        form,
        formMatcher,
      },
    ];
  },
);

// Skip non-Chrome browsers in staging to avoid MFA OTP rate-limiting.
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

for (const {
  testName,
  orgLabel,
  opportunityUrl,
  form,
  formMatcher,
} of applicantScenarios) {
  test(
    testName,
    { tag: [APPLY_FORMS, FULL_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000); // 5-min timeout

      const isMobile = testInfo.project.name.match(/[Mm]obile/);

      // --- Login ---
      await authenticateE2eUser(page, context, !!isMobile);

      // --- Navigate to Opportunity page and start a new application ---
      await createApplication(page, opportunityUrl, orgLabel);
      const applicationUrl = page.url();

      // --- Fill the form ---
      // fillForm can't add a field list entry, so open the form, add a
      // senior/key person and fill both profiles here.
      const testData = buildHappyPathTestData(form, Date.now());
      const opened = await openForm(page, formMatcher);
      if (!opened) {
        throw new Error(`Could not open ${form.formConfig.formName}`);
      }
      await addFieldListEntries(page, "senior_key_persons", 1);
      await fillFormPartial(testInfo, page, form.formConfig.fields, testData);
      await clickSaveButton(page, form.formConfig.saveButtonTestId);

      // Verify save succeeded while still on the form page
      await verifyFormStatusAfterSave(page, "complete");

      // Capture the form URL now - verifyFormStatusOnApplication navigates away
      const formUrl = page.url();

      await verifyFormStatusOnApplication(
        page,
        "complete",
        formMatcher,
        applicationUrl,
      );

      // --- Submit Application ---
      await submitApplicationAndVerify(page, "success");

      // --- Confirmation Page Validation ---
      await verifySubmissionConfirmation(page);

      // --- Print View Validation ---
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

      // --- Attachment Validation ---
      // validateAttachmentPrintViewSection expects one file per section, and each
      // profile section lists every document the person attached.
      for (const [person, sectionId] of Object.entries(
        ATTACHMENT_SECTION_IDS,
      )) {
        const files = Object.entries(form.formConfig.fields)
          .filter(
            ([key, field]) =>
              field.type === "file" && key.startsWith(`${person}--`),
          )
          .map(([key]) => testData[key]);
        await expect(
          page
            .locator(`[id="${sectionId}"]`)
            .getByRole("listitem")
            .filter({ hasText: path.basename(files[0]) }),
        ).toHaveCount(files.length);
      }
    },
  );
}
