/**
 * @feature Opportunity Competition - Happy Path
 * @scenario Happy path application package
 *
 * Notes for reviewer (what happens in this test):
 * 1) Authenticates a grantor user and creates a draft opportunity.
 * 2) Opens the Application Package page from the opportunity overview.
 * 3) Completes Submission set-up, Submission window, and Agency contact sections.
 * 4) Clicks Save and exit, then verifies overview statuses:
 *    - Opportunity Summary: Not started
 *    - Application Package: Complete
 *
 * Tester parameter guide:
 * - Dynamic values are generated in buildApplicationPackageHappyPathFillData(new Date()).
 * - To adjust input values, update fixture inputs/definitions used by:
 *   - APPLICATION_PACKAGE_SUBMISSION_SETUP_FIELD_DEFINITIONS
 *   - APPLICATION_PACKAGE_SUBMISSION_WINDOW_FIELD_DEFINITIONS
 *   - APPLICATION_PACKAGE_AGENCY_CONTACT_FIELD_DEFINITIONS
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
  APPLICATION_PACKAGE_AGENCY_CONTACT_FIELD_DEFINITIONS,
  APPLICATION_PACKAGE_SUBMISSION_SETUP_FIELD_DEFINITIONS,
  APPLICATION_PACKAGE_SUBMISSION_WINDOW_FIELD_DEFINITIONS,
  buildPageFieldsFromDefinitions,
} from "tests/e2e/opportunity/fixtures/application-package-field-definitions";
import { buildApplicationPackageHappyPathFillData } from "tests/e2e/opportunity/fixtures/application-package-fill-data";
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

test.describe("Grantor Opportunity Competition Happy Path", () => {
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
      );
    }
  });

  test(
    "Create and validate draft application package details",
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

      const opportunityFillData = buildOpportunityHappyPathFillData(new Date());
      const applicationPackageFillData =
        buildApplicationPackageHappyPathFillData(new Date());
      const opportunityTitle = opportunityFillData.opportunityTitle;

      //--------------Scenario steps start here----------------

      // Given I create a new opportunity with happy-path data.
      await createOpportunity(page, opportunityFillData);

      // And I click "Application Package" link.
      await page.getByRole("link", { name: "Application Package" }).click();

      // Then I should be on the "Application Package" page.
      await expect(page).toHaveURL(
        /\/grantor\/opportunity\/([a-z0-9-]+?)\/competition/,
      );

      // And I should see the "Back" and "Save and exit" buttons enabled.
      await assertButtonEnabledDisabledStates(page, {
        Back: true,
        "Save and exit": true,
      });

      // Fill required Submission set-up values.
      await fillPageFields(
        page,
        buildPageFieldsFromDefinitions(
          APPLICATION_PACKAGE_SUBMISSION_SETUP_FIELD_DEFINITIONS,
          applicationPackageFillData,
        ),
      );

      // Fill required Submission window values.
      await fillPageFields(
        page,
        buildPageFieldsFromDefinitions(
          APPLICATION_PACKAGE_SUBMISSION_WINDOW_FIELD_DEFINITIONS,
          applicationPackageFillData,
        ),
      );

      // Fill required Agency contact values.
      await fillPageFields(
        page,
        buildPageFieldsFromDefinitions(
          APPLICATION_PACKAGE_AGENCY_CONTACT_FIELD_DEFINITIONS,
          applicationPackageFillData,
        ),
      );

      // And all save actions should remain enabled.
      await assertButtonEnabledDisabledStates(page, {
        Back: true,
        "Save and exit": true,
      });

      // And I click "Save and exit" button.
      await page.getByRole("button", { name: "Save and exit" }).click();

      // Then I should return to the "Opportunity Overview" page.
      await expect(page).toHaveURL(
        /\/grantor\/opportunity\/([a-z0-9-]+?)\/overview/,
      );

      // And I should see overview statuses for key sections.
      await assertOverviewSectionStatus(page, {
        "Opportunity Summary": "Not started",
        "Application Package": "Complete",
      });

      // When I navigate directly to opportunity list page.
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
