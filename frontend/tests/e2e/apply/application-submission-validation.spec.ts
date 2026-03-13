import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import {
  fillSf424bForm,
  SF424B_FORM_MATCHER,
} from "tests/e2e/utils/forms/fill-sf424b-form-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import { selectFormInclusionOption } from "tests/e2e/utils/forms/select-form-inclusion-utils";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";
import {
  verifyFormFieldsAreReadonlyAfterSubmission,
  verifyPostSubmission,
} from "tests/e2e/utils/post-submission-utils";
import {
  submitApplicationAndVerify,
  type SubmitOutcome,
} from "tests/e2e/utils/submit-application-utils";

const { testOrgLabel } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab"; // TEST-APPLY-ORG-IND-ON01
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

const sf424bErrors = [
  { fieldId: "title", message: "Title is required" },
  {
    fieldId: "applicant_organization",
    message: "Applicant Organization is required",
  },
];

// Validation errors specific to required SF-424B and conditional SF-LLL form combination
const EXPECTED_SUBMISSION_ERRORS = {
  outcome: "validationError" as SubmitOutcome,
  errors: [
    "Assurances for Non-Construction Programs (SF-424B) is incomplete. Answer all required questions to submit.",
    'Disclosure of Lobbying Activities (SF-LLL) Select Yes or No for "Submit with application?" column in Conditionally-Required Forms section.',
  ],
};

// History entries in order from most recent (index 0) to oldest (last)
// reflecting the exact actions taken in this test scenario
const EXPECTED_HISTORY_ENTRIES = [
  "Application submitted", // 0
  "Form updated: Disclosure of Lobbying Activities (SF-LLL)", // 1
  "Form updated: Assurances for Non-Construction Programs (SF-424B)", // 2
  "Form updated: Assurances for Non-Construction Programs (SF-424B)", // 3
  "Application submission failed", // 4
  "Organization Added", // 5
  "Application created", // 6
];

// SF-424B field values filled during the test, verified as read-only after submission
const SF424B_READONLY_FIELDS = [
  { fieldId: "title", expectedValue: "TESTER" },
  { fieldId: "applicant_organization", expectedValue: testOrgLabel },
];

test(
  "SF-424B submission and application history validation",
  { tag: "@auth" },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    await authenticateE2eUser(page, context, !!isMobile);

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);

    await submitApplicationAndVerify(
      page,
      EXPECTED_SUBMISSION_ERRORS.outcome,
      EXPECTED_SUBMISSION_ERRORS.errors,
    );

    const applicationUrl = page.url();

    if (await openForm(page, SF424B_FORM_MATCHER)) {
      // Do not enter anything and click save
      await saveForm(page, true); // expect validation errors

      // Checks error alert list at top of form page
      // Scrolls down and checks inline field errors on form page
      // Navigates to application landing page
      // Scrolls down and checks "Some issues found" in form row
      await verifyFormStatusAfterSave(
        page,
        "incomplete",
        "SF-424B",
        applicationUrl,
        sf424bErrors,
      );
    }

    if (!(await openForm(page, SF424B_FORM_MATCHER))) {
      throw new Error(
        "Could not find or open SF-424B form link on the application forms page",
      );
    }

    // Fill SF-424B form fields using helper
    await fillSf424bForm(page, "TESTER", testOrgLabel);

    // Save the form using helper
    await saveForm(page);

    // Verify form status after save
    await verifyFormStatusAfterSave(
      page,
      "complete",
      "SF-424B",
      applicationUrl,
    );

    // Extra wait for page to fully render forms table after navigation
    await page.waitForTimeout(10000);

    // Select 'No' for including SF-LLL form in submission
    await selectFormInclusionOption(
      page,
      "Disclosure of Lobbying Activities (SF-LLL)",
      "No",
    );

    // Submit the application and verify success
    await submitApplicationAndVerify(page, "success");

    // Verify post-submission status and application history
    await verifyPostSubmission(page, EXPECTED_HISTORY_ENTRIES);

    // Open SF-424B form and verify fields are read-only after submission
    await verifyFormFieldsAreReadonlyAfterSubmission(
      page,
      SF424B_FORM_MATCHER,
      "SF-424B",
      SF424B_READONLY_FIELDS,
    );
  },
);
