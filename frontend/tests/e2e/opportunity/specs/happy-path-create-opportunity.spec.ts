/**
 * @feature Opportunity - Happy Path
 * @featureFile e2e/opportunity/features/happy-path-create-opportunity.feature
 * @scenario Happy path create opportunity
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  buildPageFieldsFromDefinitions,
  CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { assertButtonEnabledDisabledStates } from "tests/e2e/utils/common/index";
import { waitForOpportunityRowByStatus } from "tests/e2e/utils/opportunities/table-row-utils";
import { fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";

const { GRANTOR, CORE_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;

test.describe("Grantor Opportunity Happy Path", () => {
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
      );
    }
  });

  test(
    "Create opportunity draft and verify draft status on list page",
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

      // And I should be on the "Opportunities List" page
      await expect(page).toHaveURL(/\/grantor\/opportunities/);

      // When I click "Create Opportunity"
      await page.getByRole("link", { name: "Create Opportunity" }).click();

      // And I should be on the "Create Opportunity" page
      await expect(page).toHaveURL(/\/grantor\/opportunities\/create/);

      // And I enter the required create-opportunity fields.
      await fillPageFields(
        page,
        buildPageFieldsFromDefinitions(
          CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
          fillData,
        ),
      );

      // And I click "Save and continue" button
      await page.getByRole("button", { name: "Save and continue" }).click();

      // Then I should be on the "Opportunity Overview" page and the URL should include "fromCreate=true".
      await expect(page).toHaveURL(/overview\?fromCreate=true/);

      // And I should see the "Opportunity draft started" confirmation message.
      await expect(
        page.getByText("Opportunity draft started", { exact: true }),
      ).toBeVisible();

      // And I should see the "Opportunity Summary" link
      await expect(
        page.getByRole("link", { name: "Opportunity Summary" }),
      ).toBeVisible();

      // And I should see the "Preview" and "Publish" buttons disabled.
      await assertButtonEnabledDisabledStates(page, {
        Preview: false,
        Publish: false,
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
