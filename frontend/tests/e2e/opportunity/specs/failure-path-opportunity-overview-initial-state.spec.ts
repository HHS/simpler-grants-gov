/**
 * @feature Opportunity Overview - failure path initial state
 * @featureFile e2e/opportunity/features/failure-path-opportunity-overview-initial-state.feature
 * @scenario Verifies bypass attempt fails and stays on the same overview page
 *
 * Notes for reviewer (what happens in this test):
 * 1) Authenticates a grantor user.
 * 2) Creates a new opportunity using happy-path fixture data.
 * 3) Verifies the user lands on the opportunity overview page.
 * 4) Attempts to bypass gating by force-clicking Preview and Publish actions.
 * 5) Verifies bypass attempt fails by asserting URL remains on the same overview page.
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
import { createOpportunity } from "tests/e2e/utils/opportunity/create-opportunity-utils";

const { GRANTOR, OPPORTUNITY_MANAGEMENT, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;

test.describe("Grantor opportunity overview failure path - initial state gating", () => {
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
      );
    }
  });

  test(
    "Verifies bypass attempt fails and stays on the same overview page",
    { tag: [GRANTOR, OPPORTUNITY_MANAGEMENT, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      await authenticateE2eUser(
        page,
        context,
        !!testInfo.project.name.match(/[Mm]obile/),
      );

      const fillData = buildOpportunityHappyPathFillData(new Date());

      // Given I create a new opportunity with happy-path fixture data.
      await createOpportunity(page, fillData);

      // Then I should land on the overview page.
      await expect(page).toHaveURL(
        /\/grantor\/opportunity\/([a-z0-9-]+?)\/overview/,
      );

      // And I should see the "Preview" and "Publish" buttons disabled.
      await assertButtonEnabledDisabledStates(page, {
        Preview: false,
        Publish: false,
      });

      const overviewUrl = page.url();

      // When I attempt to click Preview, navigation should not occur.
      await page
        .getByRole("button", { name: "Preview" })
        .click({ force: true });

      // Then I should still be on the same overview URL.
      await expect(page).toHaveURL(overviewUrl);

      // When I attempt to click Publish, navigation should not occur.
      await page
        .getByRole("button", { name: "Publish" })
        .click({ force: true });

      // Then I should still be on the same overview URL.
      await expect(page).toHaveURL(overviewUrl);
    },
  );
});
