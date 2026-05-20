import { waitForElementVisible } from "tests/e2e/utils/wait-for-element-visible";
/**
 * @feature Opportunity - Happy Path
 * @featureFile e2e/opportunity/features/happy-path-create-opportunity.feature
 * @scenario Happy Path - Create Opportunity
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { opportunityFields } from "../fixtures/opportunity-fields-unified";
import { opportunityPageConfig } from "tests/e2e/opportunity/fixtures/opportunity-page-config";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { gotoWithRetry } from "tests/e2e/utils/lifecycle-utils";
import { fillOpportunityPage } from "tests/e2e/utils/page/opportunity-page-filling";
import { loadDefaultErrorComponents } from "next/dist/server/load-default-error-components";
// import { clickSavePageButton } from "tests/e2e/utils/page/save-page-utils";

const { baseUrl } = playwrightEnv;
const { GRANTOR } = VALID_TAGS;
const { targetEnv } = playwrightEnv;
const OPPORTUNITY_LIST_URL = `/opportunities`;

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
  "Happy Path - Create Opportunity",
  { tag: [GRANTOR] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    // Given the user is logged in
    await authenticateE2eUser(page, context, !!isMobile);

    // Navigate to Opportunities List page after login
    await gotoWithRetry(page, `${baseUrl}${OPPORTUNITY_LIST_URL}`, {
      waitUntil: "domcontentloaded",
    });

    // expect to be on the Opportunities List page
    await expect(
      page.getByRole("heading", { name: "Opportunities List" }),
    ).toBeVisible();

    // click the "Create Opportunity" button (anchor with class 'usa-button') to go to the "Create Opportunity" page
    await page
      .locator("a.usa-button", { hasText: "Create Opportunity" })
      .click();



    // Build fill data from unified fixture for create
    const createOpportunityFillData = Object.fromEntries(
      opportunityFields
        .filter(f => f.fill.create !== undefined)
        .map(f => [f.key, f.fill.create])
    );

    // List of keys for fields visible on the first page (before Save and Continue)
    const firstPageKeys = [
      "opportunityNumber",
      "opportunityTitle",
      "grantSelectionMethod",
      "assistanceListingNumber"
      // Add more keys here if more fields are visible on the first page
    ];

    // Only fill fields visible on the first page
    const firstPageFillData = Object.fromEntries(
      Object.entries(createOpportunityFillData).filter(([k]) => firstPageKeys.includes(k))
    );

    const filteredFirstPageFillData: Record<string, string | boolean> = Object.fromEntries(
      Object.entries(firstPageFillData)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, v as string | boolean])
    );
    await fillOpportunityPage(
      testInfo,
      page,
      opportunityPageConfig,
      filteredFirstPageFillData, // Only fields visible on the first page, no undefined values
    );

    // Save and continue button should take us to the edit page for the newly created opportunity

    // await clickSavePageButton(page);
    // Wait for navigation and the edit page heading to be visible to avoid race conditions
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `Opportunity #: ${createOpportunityFillData.opportunityNumber}`,
    );
    // Use the reusable wait utility for the next page's key field
    await waitForElementVisible(page, page.getByLabel("Funding type*"));

    // Verify that the fields filled on the first page are saved and displayed correctly on the edit page
    await expect(
      page.getByRole("heading", { level: 3, name: "Opportunity draft started" }),
    ).toBeVisible();
    await expect(
      page.getByText("Your initial information has been saved. Complete the sections below to finish your opportunity details", { exact: false }),
    ).toBeVisible();

    // Wait for the page to be stable before filling the rest of the fields (prevents race conditions)
    await page.waitForTimeout(3000);

    // Now fill the rest of the fields (including Funding type*)
    const restOfFieldsKeys = Object.keys(createOpportunityFillData).filter(k => !firstPageKeys.includes(k));
    const restOfFieldsFillData = Object.fromEntries(
      Object.entries(createOpportunityFillData).filter(([k]) => restOfFieldsKeys.includes(k))
    );
    if (Object.keys(restOfFieldsFillData).length > 0) {
      const filteredRestOfFieldsFillData: Record<string, string | boolean> = Object.fromEntries(
        Object.entries(restOfFieldsFillData)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, v as string | boolean])
      );
      await fillOpportunityPage(
        testInfo,
        page,
        opportunityPageConfig,
        filteredRestOfFieldsFillData,
      );
    }


    // After creating the opportunity, we should be on the edit page. Now fill in the additional details from unified fixture
    const editOpportunityFillData = Object.fromEntries(
      opportunityFields
        .filter(f => f.fill.edit !== undefined)
        .map(f => [f.key, f.fill.edit])
    );
    // If all edit values are undefined, provide an empty object to avoid type errors
    const filteredEditOpportunityFillData: Record<string, string | boolean> = Object.keys(editOpportunityFillData).length === 0
      ? {}
      : Object.fromEntries(
          Object.entries(editOpportunityFillData)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, v! as string | boolean])
        );
    await fillOpportunityPage(
      testInfo,
      page,
      opportunityPageConfig,
      filteredEditOpportunityFillData,
    );

    // Verify save confirmation on the edit page
    await expect(
      page.getByRole("heading", { level: 3, name: "Saved successfully" }),
    ).toBeVisible();
    await expect(
      page.getByText("Your changes have been saved.", { exact: false }),
    ).toBeVisible();

    // Wait for the Publish button to be visible before clicking
    await waitForElementVisible(page, page.getByRole("button", { name: "Publish" }));
    
    // Publish Opportunity
    await page.getByRole("button", { name: "Publish" }).click();
    // Wait for the Opportunities List heading to be visible after publishing
    await waitForElementVisible(page, page.getByRole("heading", { name: "Opportunities List" }));

    await expect(
      page.getByRole("heading", { name: "Opportunities List" }),
    ).toBeVisible();
    await expect(page.getByTestId("responsive-data-0-2")).toHaveText("posted");
  },
);
