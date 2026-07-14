/**
 * @feature Opportunity Summary - Happy Path
 * @featureFile e2e/opportunity/features/happy-path-opportunity-summary.feature
 * @scenario Happy path opportunity summary
 *
 * Notes for reviewer (what happens in this test):
 * 1) Authenticates a grantor user and navigates to opportunities list.
 * 2) Creates a new opportunity using happy-path fixture data.
 * 3) Opens Opportunity Summary edit page and verifies save actions are enabled.
 * 4) Completes Funding details, Eligibility, and Additional information sections.
 * 5) Clicks Save and exit, verifies overview statuses:
 *    - Opportunity Summary: Complete
 *    - Application Package: Not started
 * 6) Returns to opportunities list and verifies created opportunity remains Draft.
 *
 * Tester parameter guide:
 * - Dynamic values are generated in buildOpportunityHappyPathFillData(new Date()).
 * - To adjust input values, update fixture inputs/definitions used by:
 *   - FUNDING_DETAILS_FIELD_DEFINITIONS
 *   - ELIGIBILITY_FIELD_DEFINITIONS
 *   - ADDITIONAL_INFORMATION_FIELD_DEFINITIONS
 * - Row verification uses generated opportunity title and expected status: Draft.
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  ADDITIONAL_INFORMATION_FIELD_DEFINITIONS,
  buildPageFieldsFromDefinitions,
  ELIGIBILITY_FIELD_DEFINITIONS,
  FUNDING_DETAILS_FIELD_DEFINITIONS,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { assertButtonEnabledDisabledStates } from "tests/e2e/utils/common/index";
import { assertOverviewSectionStatus } from "tests/e2e/utils/opportunities/overview-status-utils";
import { waitForOpportunityRowByStatus } from "tests/e2e/utils/opportunities/table-row-utils";
import { createOpportunity } from "tests/e2e/utils/opportunity/create-opportunity-utils";
import { fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";

const { GRANTOR, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;

test.describe("Grantor Opportunity Summary Happy Path", () => {
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
      );
    }
  });

  test(
    "Create and validate draft opportunity details",
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
      const opportunityTitle = fillData.opportunityTitle;

      //--------------Scenario steps start here----------------

      // Given I use direct URL "/grantor/opportunities" to navigate to the "Opportunities List" page
      await page.goto("/grantor/opportunities");

      // And I create a new opportunity with happy-path data.
      await createOpportunity(page, fillData);

      // And I click "Opportunity Summary" link
      await page.getByRole("link", { name: "Opportunity Summary" }).click();

      // Then I should be on the "Opportunity Summary" page.
      await expect(page).toHaveURL(
        /\/grantor\/opportunity\/([a-z0-9-]+?)\/edit/,
      );

      // And I should see the "Save and exit", "Save and go back", and "Save and continue" buttons enabled.
      await assertButtonEnabledDisabledStates(page, {
        "Save and exit": true,
        "Save and go back": true,
        "Save and continue": true,
      });

      // Fill required Funding details values.
      await fillPageFields(
        page,
        buildPageFieldsFromDefinitions(
          FUNDING_DETAILS_FIELD_DEFINITIONS,
          fillData,
        ),
      );

      // Fill required Eligibility values.
      await fillPageFields(
        page,
        buildPageFieldsFromDefinitions(ELIGIBILITY_FIELD_DEFINITIONS, fillData),
      );

      // Fill optional Additional information values.
      await fillPageFields(
        page,
        buildPageFieldsFromDefinitions(
          ADDITIONAL_INFORMATION_FIELD_DEFINITIONS,
          fillData,
        ),
      );

      // And all save actions should remain enabled
      await assertButtonEnabledDisabledStates(page, {
        "Save and exit": true,
        "Save and go back": true,
        "Save and continue": true,
      });

      // And I click "Save and exit" button
      await page.getByRole("button", { name: "Save and exit" }).click();

      // Then I should return to the "Opportunity Overview" page.
      await expect(page).toHaveURL(
        /\/grantor\/opportunity\/([a-z0-9-]+?)\/overview/,
      );

      // And I should see overview statuses for key sections.
      await assertOverviewSectionStatus(page, {
        "Opportunity Summary": "Complete",
        "Application Package": "Not started",
      });

      // When I navigate directly to opportunity list page
      await page.goto("/grantor/opportunities");

      // Then I should see "Draft" status for the created opportunity row.
      const matchingRow = await waitForOpportunityRowByStatus(page, {
        title: opportunityTitle,
        status: "Draft",
        message: 'Waiting for "Draft" opportunity row to appear on list',
      });

      // And the matching row should be visible.
      await expect(matchingRow).toBeVisible();

      //--------------Scenario steps end here----------------
    },
  );
});
