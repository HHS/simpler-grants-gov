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
import { opportunityFieldDefinitions } from "tests/e2e/opportunity/fixtures/opportunity-field-definitions";
import {
  createOpportunityFillData,
  editOpportunityFillData,
} from "tests/e2e/opportunity/fixtures/opportunity-fill-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { fillOpportunityPage } from "tests/e2e/utils/page/opportunity-page-filling";
import { gotoWithRetry } from "tests/e2e/utils/lifecycle-utils";

const { baseUrl } = playwrightEnv;
const { GRANTOR } = VALID_TAGS;
const { targetEnv } = playwrightEnv;

// Define the page configuration
const opportunityPageConfig = {
  fields: opportunityFieldDefinitions,
  saveButtonTestId: "save-button",
};

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

    // Fill the opportunity page using the reusable function and fixtures
    await fillOpportunityPage(
      testInfo,
      page,
      opportunityPageConfig,
      createOpportunityFillData,
    );

    // Save and continue button should take us to the edit page for the newly created opportunity
    await page.getByRole("button", { name: "Save and continue" }).click();

    // Verify that we are on the edit page by checking for the entered opportunity number in the heading
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `Opportunity #: ${createOpportunityFillData.opportunityNumber}`,
    );

    // After creating the opportunity, we should be on the edit page. Now fill in the additional details.
    await fillOpportunityPage(
      testInfo,
      page,
      opportunityPageConfig,
      editOpportunityFillData,
    );

    // Verify save confirmation on the edit page
    await expect(
      page.getByRole("heading", { level: 3, name: "Saved successfully" }),
    ).toBeVisible();
    await expect(
      page.getByText("Your changes have been saved.", { exact: false }),
    ).toBeVisible();

    // Publish Opportunity
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(
      page.getByRole("heading", { name: "Opportunities List" }),
    ).toBeVisible();
    await expect(page.getByTestId("responsive-data-0-2")).toHaveText("posted");
  },
);
