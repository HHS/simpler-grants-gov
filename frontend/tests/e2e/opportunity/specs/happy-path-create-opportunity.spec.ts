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
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import {
  assertActionsColumnLinksByStatus,
  assertButtonEnabledDisabledStates,
  assertLocatorVisible,
  assertPageDetailsVisible,
  assertTextVisible,
  clickRowTitle,
  formatNumberWithCommas,
  selectOptionByLabel,
  waitForOpportunityRowByStatus,
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

      const isMobile = testInfo.project.name.match(/[Mm]obile/);
      await authenticateE2eUser(page, context, !!isMobile);

      const fillData = buildOpportunityHappyPathFillData(new Date());
      const opportunityNumber = fillData.opportunityNumber;
      const opportunityTitle = fillData.opportunityTitle;

      const createOpportunityPageFields = buildPageFieldsFromDefinitions(
        CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
        fillData,
      );
      const fundingDetailsPageFields = buildPageFieldsFromDefinitions(
        FUNDING_DETAILS_FIELD_DEFINITIONS,
        fillData,
      );
      const eligibilityPageFields = buildPageFieldsFromDefinitions(
        ELIGIBILITY_FIELD_DEFINITIONS,
        fillData,
      );
      const additionalInformationPageFields = buildPageFieldsFromDefinitions(
        ADDITIONAL_INFORMATION_FIELD_DEFINITIONS,
        fillData,
      );

      // Given I use direct URL "/grantor/opportunities" to navigate to the "Opportunities List" page
      await page.goto("/grantor/opportunities");
      // And I should be on the "Opportunities List" page
      await expect(page).toHaveURL(/\/grantor\/opportunities/);

      // When I click "Create Opportunity"
      await page.getByRole("link", { name: "Create Opportunity" }).click();
      // And I should be on the "Create Opportunity" page
      await expect(page).toHaveURL(/\/grantor\/opportunities\/create/);

      // And I enter the following values: Opportunity number, Opportunity title, Grant selection method, Assistance listing number
      await fillPageFields(page, createOpportunityPageFields, testInfo);

      // And I click "Save and continue" button
      await page.getByRole("button", { name: "Save and continue" }).click();

      // Then I should be on the Opportunity edit page / And the URL should include "fromCreate=true"
      await expect(page).toHaveURL(/fromCreate=true/);
      // And I should see "Opportunity draft started"
      await expect(page.getByText("Opportunity draft started", { exact: true })).toBeVisible();

      // And I should see button states: Save enabled, Publish disabled, Preview disabled
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Publish: false,
        Preview: false,
      });

      // And I fill in the required fields in each section to enable the Publish button:
      // When I update "Funding details" section / And I enter the following funding values
      await fillPageFields(page, fundingDetailsPageFields, testInfo);

      // And I update "Eligibility" section / And I enter the following eligible applicants
      await fillPageFields(page, eligibilityPageFields, testInfo);
      await fillPageFields(page, additionalInformationPageFields, testInfo);

      // And I click "Save" button
      await page.getByRole("button", { name: "Save" }).click();

      // Then I should see "Opportunity draft started"
      await expect(page.getByText("Opportunity draft started", { exact: true })).toBeVisible();
      // And I should see the save confirmation message
      await expect(
        page.getByText(
          "Your initial information has been saved. Complete the sections below to finish your opportunity details",
          { exact: true },
        ),
      ).toBeVisible();
      // And I should see Opportunity status "Draft"
      await assertLocatorVisible(
        page.locator("span.display-inline-flex", { hasText: "Draft" }).first(),
      );
      // And I should see Opportunity title / Opportunity number / Grant selection method values
      await assertTextVisible(page, opportunityTitle);
      await assertTextVisible(page, opportunityNumber);
      await assertTextVisible(page, "Discretionary");

      // And the URL should include "fromCreate=true"
      await expect(page).toHaveURL(/fromCreate=true/);
      // And I should see button states: Save enabled, Publish enabled, Preview disabled
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Publish: true,
        Preview: false,
      });

      // When I select "Select" in "Funding type" to make the Publish button disabled
      await selectOptionByLabel(page, "Funding type", "Select");
      // Then I should see button states: Save enabled, Publish disabled, Preview disabled
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Publish: false,
        Preview: false,
      });

      // When I select "Cooperative Agreement" in "Funding type" to make the Publish button enabled again
      await selectOptionByLabel(page, "Funding type", fillData.fundingType_2);
      // Then I should see button states: Save enabled, Publish enabled, Preview disabled
      await assertButtonEnabledDisabledStates(page, {
        Save: true,
        Publish: true,
        Preview: false,
      });

      // And I click "Publish" button
      await page.getByRole("button", { name: "Publish" }).click();

      // Then I should be on the "Opportunities List" page
      await expect(page).toHaveURL(/\/grantor\/opportunities/);

      // And I should see "posted" in the "Status" column for the opportunity title
      const matchingRow = await waitForOpportunityRowByStatus(page, {
        title: opportunityTitle,
        status: "posted",
        message: "Waiting for posted opportunity row to appear on list",
      });
      // And I should not see Edit, Copy, Delete links in the Actions column for the opportunity row
      await assertActionsColumnLinksByStatus(matchingRow, {
        status: "posted",
        actionLinkVisibility: {
          Edit: false,
          Copy: false,
          Delete: false,
        },
      });

      // When I click on the opportunity title
      await clickRowTitle(matchingRow, opportunityTitle);

      const finalAssertions = [
        opportunityTitle,
        opportunityNumber,
        fillData.assistanceListingNumber,
        fillData.fundingType_2,
        fillData.grantSelectionMethod,
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
      // And I should see the opportunity details values displayed correctly on the page
      await assertPageDetailsVisible(page, {
        heading: opportunityTitle,
        texts: finalAssertions,
      });
    },
  );
});
