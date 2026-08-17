/**
 * @feature Opportunity - Happy Path
 * @featureFile e2e/opportunity/features/happy-path-opportunities-list.feature
 * @scenario Grantor opportunities list page UI
 *
 * Notes for reviewer (what happens in this test):
 * 1) Authenticates a grantor user.
 * 2) Navigates to the Grantor Opportunities List page.
 * 3) Verifies the user lands on the opportunities list page.
 * 4) Verifies key page controls are visible:
 *    - Opportunities list heading
 *    - Opportunities count
 *    - Create Opportunity link
 *    - Opportunities table
 *    - Title, Status, and Action column headers
 *    - Page 1 pagination button
 *    - Next pagination button
 * 5) Verifies the Create Opportunity link points to the expected create opportunity route.
 *
 * Tester parameter guide:
 * - Page locator definitions are maintained in:
 *   - tests/e2e/opportunity/fixtures/opportunity-list-page-definition.ts
 * - To update labels, roles, text, or selectors used by this test, update:
 *   - OPPORTUNITIES_LIST_PAGE_DEFINITIONS
 * - This scenario validates the initial Opportunities List page UI only.
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  getOpportunityListPageLocator,
  OPPORTUNITIES_LIST_PAGE_DEFINITIONS,
} from "tests/e2e/opportunity/fixtures/opportunity-list-definition";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";

const { GRANTOR, OPPORTUNITY_MANAGEMENT, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;

test.describe("Grantor opportunities list page happy path", () => {
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
      );
    }
  });

  test(
    "Loads the opportunities list page and shows key list controls",
    { tag: [GRANTOR, OPPORTUNITY_MANAGEMENT, CORE_REGRESSION] },
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

      // Define commonly used locators at the beginning of the test for better readability of the scenario steps.
      const createOpportunityLink = getOpportunityListPageLocator(
        page,
        OPPORTUNITIES_LIST_PAGE_DEFINITIONS.createOpportunityLink,
      );

      //--------------Scenario steps start here----------------

      // Given I navigate to the Grantor Opportunities List page.
      await page.goto("/grantor/opportunities");

      // Then I should be redirected to the Opportunities List page.
      await expect(page).toHaveURL(/\/grantor\/opportunities/);

      // And I should see the Opportunities List heading.
      await expect(
        getOpportunityListPageLocator(
          page,
          OPPORTUNITIES_LIST_PAGE_DEFINITIONS.pageHeading,
        ),
      ).toBeVisible();

      // And I should see the opportunities count.
      await expect(
        getOpportunityListPageLocator(
          page,
          OPPORTUNITIES_LIST_PAGE_DEFINITIONS.opportunitiesCount,
        ),
      ).toBeVisible();

      // And I should see the Create Opportunity link.
      await expect(createOpportunityLink).toBeVisible();

      // And the Create Opportunity link should navigate to the create opportunity page.
      await expect(createOpportunityLink).toHaveAttribute(
        "href",
        /grantor\/opportunities\/create\?agency=/,
      );

      // And I should see the Opportunities table.
      await expect(
        getOpportunityListPageLocator(
          page,
          OPPORTUNITIES_LIST_PAGE_DEFINITIONS.opportunitiesTable,
        ),
      ).toBeVisible();

      // And I should see the Title column header.
      await expect(
        getOpportunityListPageLocator(
          page,
          OPPORTUNITIES_LIST_PAGE_DEFINITIONS.titleColumnHeader,
        ),
      ).toBeVisible();

      // And I should see the Status column header.
      await expect(
        getOpportunityListPageLocator(
          page,
          OPPORTUNITIES_LIST_PAGE_DEFINITIONS.statusColumnHeader,
        ),
      ).toBeVisible();

      // And I should see the Action column header.
      await expect(
        getOpportunityListPageLocator(
          page,
          OPPORTUNITIES_LIST_PAGE_DEFINITIONS.actionColumnHeader,
        ),
      ).toBeVisible();

      // And I should see the Page 1 pagination button.
      await expect(
        getOpportunityListPageLocator(
          page,
          OPPORTUNITIES_LIST_PAGE_DEFINITIONS.pageOneButton,
        ),
      ).toBeVisible();

      // And I should see the Next pagination button.
      await expect(
        getOpportunityListPageLocator(
          page,
          OPPORTUNITIES_LIST_PAGE_DEFINITIONS.nextButton,
        ),
      ).toBeVisible();

      //--------------Scenario steps end here----------------
    },
  );
});
