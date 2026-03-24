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
import {
  fillForm,
  verifyFormLinkVisible,
} from "tests/e2e/utils/forms/general-forms-filling";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

import {
  ATTACHMENT_FORM_CONFIG,
  ATTACHMENT_FORM_MATCHER,
} from "./fixtures/attachment-field-definitions";
import { attachmentHappyPathTestData } from "./fixtures/attachment-fill-data";

const { APPLY, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel, targetEnv } = playwrightEnv;

// Environment-specific opportunity IDs
// Staging: ecd28401-ba6a-4ce7-928f-0f9fc77c5702
// Local:   <replace-with-local-opportunity-id>
const OPPORTUNITY_ID =
  targetEnv === "staging"
    ? "ecd28401-ba6a-4ce7-928f-0f9fc77c5702"
    : "<replace-with-local-opportunity-id>";

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
  "Application form completion happy path - Attachment Form",
  { tag: [APPLY, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);
    await authenticateE2eUser(page, context, !!isMobile);
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);

    // Verify the Attachment Form link is visible on the application page
    await verifyFormLinkVisible(page, ATTACHMENT_FORM_MATCHER);

    // Fill Attachment 1 — the form requires at least one attachment to be complete
    await fillForm(
      testInfo,
      page,
      ATTACHMENT_FORM_CONFIG,
      attachmentHappyPathTestData,
      false,
    );

    await page.waitForTimeout(2000);

    // Verify form status after save - form with attachments resolves to "complete" when file is present
    await verifyFormStatusAfterSave(page, "complete");
  },
);
