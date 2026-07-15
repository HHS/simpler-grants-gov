/**
 * @feature Opportunity Overview - Happy Path
 * @featureFile e2e/opportunity/features/happy-path-opportunity-overview.feature
 * @scenario Happy path opportunity overview
 *
 * Notes for reviewer (what happens in this test):
 * 1) Authenticates a grantor user.
 * 2) Creates a new opportunity using happy-path fixture data.
 * 3) Verifies the user lands on the opportunity overview page.
 * 4) Verifies overview statuses:
 *    - Opportunity Summary: Not started
 *    - Application Package: Not started
 * 5) Verifies "Preview" and "Publish" buttons are disabled when no sections are complete.
 *
 * Tester parameter guide:
 * - Dynamic values are generated in buildOpportunityHappyPathFillData(new Date()).
 * - To adjust opportunity creation inputs, update the fixture builder in:
 *   - tests/e2e/opportunity/fixtures/opportunity-pages-fill-data.ts
 * - This scenario validates initial overview state only (before any section is completed).
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { assertButtonEnabledDisabledStates } from "tests/e2e/utils/common/index";
import { assertOverviewSectionStatus } from "tests/e2e/utils/opportunities/overview-status-utils";
import { createOpportunity } from "tests/e2e/utils/opportunity/create-opportunity-utils";

const { GRANTOR, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;

test.describe("Grantor opportunity overview happy path - initial state", () => {
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
      );
    }
  });

  test(
    "Verifies initial state of opportunity overview page with happy path fixture data",
    { tag: [GRANTOR, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      //--------------Test setup start here----------------
      await authenticateE2eUser(
        page,
        context,
        !!testInfo.project.name.match(/[Mm]obile/),
      );

      // Define commonly used values for assertions and form filling at the beginning of the test for better readability of the scenario steps.
      const fillData = buildOpportunityHappyPathFillData(new Date());

      //--------------Scenario steps start here----------------

      // Given I create a new opportunity with happy path fixture data.
      await createOpportunity(page, fillData);

      // And I should be redirected to the opportunity overview page.
      await expect(page).toHaveURL(
        /\/grantor\/opportunity\/([a-z0-9-]+?)\/overview/,
      );

      // Then I should see overview statuses for key sections.
      await assertOverviewSectionStatus(page, {
        "Opportunity Summary": "Not started",
        "Application Package": "Not started",

        /* Enable this when the overview page is updated to include these sections.
        "Key information": "Not started",
        "Funding type": "Not started",
        "Eligibility": "Not started",
        "Additional information": "Not started",
        "Attachments": "Not started",
        "Application requirements": "Not started",
        "Forms": "Not started",        
        */
      });

      // And I should see the "Preview" and "Publish" buttons are disabled.
      await assertButtonEnabledDisabledStates(page, {
        Preview: false,
        Publish: false,
      });

      //--------------Scenario steps end here----------------
    },
  );
});
