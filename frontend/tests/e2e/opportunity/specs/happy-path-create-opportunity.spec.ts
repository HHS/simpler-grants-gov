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
  ADDITIONAL_INFORMATION_FIELD_DEFINITIONS,
  buildPageFieldsFromDefinitions,
  CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
  ELIGIBILITY_FIELD_DEFINITIONS,
  FUNDING_DETAILS_FIELD_DEFINITIONS,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";
import { searchOpportunityByValue } from "tests/e2e/opportunity/search-opportunity-utils";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import {
  assertActionsColumnLinksByStatus,
  assertButtonEnabledDisabledStates,
  assertPageHeadingAndTextsVisible,
  assertTextsVisibleOnPage,
  clickRowLinkByText,
  formatNumberWithCommas,
  selectOptionByLabel,
  waitForRowByColumns,
} from "tests/e2e/utils/common/index";
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
    "Create, publish, and validate opportunity details",
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
      const opportunityNumber = fillData.opportunityNumber;
      const opportunityTitle = fillData.opportunityTitle;
      const grantSelectionMethod = fillData.grantSelectionMethod;

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

      // Then I should be on the "Edit Opportunity" page and the URL should include "fromCreate=true".
      await expect(page).toHaveURL(/fromCreate=true/);

      // And I should see the "Opportunity draft started" confirmation message.
      await expect(
        page.getByText("Opportunity draft started", { exact: true }),
      ).toBeVisible();

      // And "Save" should be enabled while "Publish" and "Preview" remain disabled.
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Publish: false,
        Preview: false,
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

      // And I click "Save" button
      await page.getByRole("button", { name: "Save" }).click();

      // Then I should see the "Opportunity draft started" confirmation message.
      await expect(
        page.getByText("Opportunity draft started", { exact: true }),
      ).toBeVisible();

      // And I should see the save confirmation message "Your initial information has been saved...".
      await expect(
        page.getByText(
          "Your initial information has been saved. Complete the sections below to finish your opportunity details",
          { exact: true },
        ),
      ).toBeVisible();

      // And I should see "Draft" status.
      await expect(
        page.locator("span.display-inline-flex", { hasText: "Draft" }).first(),
      ).toBeVisible();

      // And I should see Opportunity title / Opportunity number / Grant selection method values
      await assertTextsVisibleOnPage(page, [
        opportunityTitle,
        opportunityNumber,
        grantSelectionMethod,
      ]);

      // And the URL should include "fromCreate=true"
      await expect(page).toHaveURL(/fromCreate=true/);

      // And "Save" and "Publish" should be enabled while "Preview" remains disabled.
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Publish: true,
        Preview: false,
      });

      // When I set "Funding type" to "Select", "Publish" should become disabled.
      await selectOptionByLabel(page, "Funding type", "Select");

      // Then "Save" should remain enabled and "Publish" should be disabled.
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Publish: false,
        Preview: false,
      });

      // When I set "Funding type" to "Cooperative Agreement", "Publish" should be enabled again.
      await selectOptionByLabel(page, "Funding type", fillData.fundingType_2);

      // Then "Save" and "Publish" should be enabled while "Preview" remains disabled.
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Publish: true,
        Preview: false,
      });

      // And I click "Publish" button
      await page.getByRole("button", { name: "Publish" }).click();

      // Then I should return to the "Opportunities List" page.
      await expect(page).toHaveURL(/\/grantor\/opportunities/);

      // Match the published opportunity row by title and status on the "Opportunities List" page
      const matchingRow_opportunitylistpage = await waitForRowByColumns(page, {
        columnValues: {
          Title: opportunityTitle,
          Status: "posted",
        },
      });

      // And link visibility should match the expected "posted" actions behavior.
      await assertActionsColumnLinksByStatus(matchingRow_opportunitylistpage, {
        status: "posted",
        actionLinkVisibility: {
          Edit: true,
          Copy: false,
          Delete: false,
        },
      });

      // When I open the "Opportunity details" page from the row title.
      await clickRowLinkByText(
        matchingRow_opportunitylistpage,
        opportunityTitle,
      );

      const finalAssertions = [
        opportunityTitle,
        opportunityNumber,
        fillData.assistanceListingNumber,
        fillData.fundingType_2,
        grantSelectionMethod,
        fillData.category,
        fillData.expectedNumberOfAwards,
        formatNumberWithCommas(fillData.awardMinimum),
        formatNumberWithCommas(fillData.awardMaximum),
        formatNumberWithCommas(fillData.estimatedTotalProgramFunding),
        fillData.eligibleApplicantSmallBusinesses,
        fillData.eligibleApplicantOtherNativeAmericanTribalOrganizations,
        fillData.eligibleApplicantIndependentSchoolDistricts,
        fillData.eligibleApplicantIndividuals,
        fillData.eligibleApplicantStateGovernments,
        fillData.description,
        fillData.linkDisplayText,
        fillData.grantorContactDetails,
        fillData.contactEmail,
        fillData.emailDisplayText,
      ];

      // Then I should see the expected opportunity details on the "Opportunity details" page.
      await assertPageHeadingAndTextsVisible(page, {
        heading: opportunityTitle,
        texts: finalAssertions,
      });

      // And I navigate to the "Search funding opportunities" page
      await page.goto("/search");

      // Then I should be on the "Search funding opportunities" page
      await assertPageHeadingAndTextsVisible(page, {
        heading: "Search funding opportunities",
        texts: [],
      });

      // When I search for the published opportunity by title
      await searchOpportunityByValue(page, opportunityTitle);

      // Match the published opportunity row on Search page with generic-safe polling.
      const matchingRow_searchFundingOpportunitiesPage =
        await waitForRowByColumns(page, {
          columnValues: {
            Title: opportunityTitle,
            Status: "Open",
          },
        });

      // Then I should see the matching row and it should contain the expected opportunity.
      await expect(matchingRow_searchFundingOpportunitiesPage).toBeVisible();
      await expect(matchingRow_searchFundingOpportunitiesPage).toContainText(
        "Open",
      );
      await expect(matchingRow_searchFundingOpportunitiesPage).toContainText(
        opportunityNumber,
      );

      //--------------Scenario steps end here----------------
    },
  );
});
