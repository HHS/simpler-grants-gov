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
  submitApplicationAndVerify,
  type SubmitOutcome,
} from "tests/e2e/utils/submit-application-utils";

const { testOrgLabel } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab"; // TEST-APPLY-ORG-IND-ON01
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;


// Below validation errors are specific to required SF424B and conditional SFLLL form.
const EXPECTED_SUBMISSION_ERRORS = {
  outcome: "validationError" as SubmitOutcome,
  errors: [
    "Assurances for Non-Construction Programs (SF-424B) is incomplete. Answer all required questions to submit.",
    'Disclosure of Lobbying Activities (SF-LLL) Select Yes or No for "Submit with application?" column in Conditionally-Required Forms section.',
  ],
};

test(
  "SF-424B error validation - required fields and inline errors",
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
  },
);
