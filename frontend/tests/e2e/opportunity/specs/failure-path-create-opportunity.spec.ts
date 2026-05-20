
/**
 * @feature Opportunity - Failure Path
 * @featureFile e2e/opportunity/features/failure-path-create-opportunity.feature
 * @scenario Failure Path - Create Opportunity
 */

import { expect, test, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import { opportunityFields } from "../fixtures/opportunity-fields-unified";
import { opportunityPageConfig } from "tests/e2e/opportunity/fixtures/opportunity-page-config";
import { fillOpportunityPage } from "tests/e2e/utils/page/opportunity-page-filling";
import { testCharacterLimit } from "../../utils/character-limit-utils";
import { gotoWithRetry } from "tests/e2e/utils/lifecycle-utils";
import { waitForElementVisible } from "../../utils/wait-for-element-visible";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";

// --- Test Data Preparation ---
const createOpportunityFillData = Object.fromEntries(
  opportunityFields.filter(f => f.fill.create !== undefined).map(f => [f.key, f.fill.create])
);
const filteredCreateOpportunityFillData: Record<string, string | boolean> = Object.fromEntries(
  Object.entries(createOpportunityFillData).filter(([, v]) => v !== undefined).map(([k, v]) => [k, v as string | boolean])
);

const { baseUrl, targetEnv } = playwrightEnv;
const { GRANTOR } = VALID_TAGS;
const OPPORTUNITY_LIST_URL = "/opportunities";

// --- Test Hooks ---
// Skip non-Chrome browsers in staging to avoid OTP rate-limiting
test.beforeEach(({ page: _ }, testInfo) => {
  if (targetEnv === "staging") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting"
    );
  }
});

test(
  "Failure Path - Create Opportunity (duplicate number)",
  { tag: [GRANTOR] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    // --- Step 1: Log in as E2E user ---
    await authenticateE2eUser(page, context, !!isMobile);

    // --- Step 2: Go to Opportunities List ---
    await gotoWithRetry(page, `${baseUrl}${OPPORTUNITY_LIST_URL}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Opportunities List" })).toBeVisible();

    // --- Step 3: Create Opportunity 1 with a fixed number ---
    await page.locator("a.usa-button", { hasText: "Create Opportunity" }).click();
    await waitForElementVisible(page, page.getByRole('textbox', { name: 'Opportunity number*' }));
    const fixedOpportunityNumber = filteredCreateOpportunityFillData.opportunityNumber;
    const firstPageFields = {
      opportunityNumber: fixedOpportunityNumber,
      opportunityTitle: filteredCreateOpportunityFillData.opportunityTitle,
      grantSelectionMethod: filteredCreateOpportunityFillData.grantSelectionMethod,
      assistanceListingNumber: filteredCreateOpportunityFillData.assistanceListingNumber,
    };
    await fillOpportunityPage(testInfo, page, opportunityPageConfig, firstPageFields);
    await waitForElementVisible(page, page.getByRole('combobox', { name: 'Funding type*' }));
    await gotoWithRetry(page, `${baseUrl}${OPPORTUNITY_LIST_URL}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Opportunities List" })).toBeVisible();

    // --- Step 4: Create Opportunity 2 with the same number to trigger duplicate error ---
    await page.locator("a.usa-button", { hasText: "Create Opportunity" }).click();
    await waitForElementVisible(page, page.getByRole('textbox', { name: 'Opportunity number*' }));
    const duplicateFirstPageFields = {
      opportunityNumber: fixedOpportunityNumber,
      opportunityTitle: filteredCreateOpportunityFillData.opportunityTitle,
      grantSelectionMethod: filteredCreateOpportunityFillData.grantSelectionMethod,
      assistanceListingNumber: filteredCreateOpportunityFillData.assistanceListingNumber,
    };
    await fillOpportunityPage(testInfo, page, opportunityPageConfig, duplicateFirstPageFields);
    await expect(page.getByRole("heading", { name: "Error" })).toBeVisible();
    await expect(page.getByText(/Opportunity with number '.*' already exists/)).toBeVisible();
    const errorMessage = await page.getByText(/Opportunity with number '.*' already exists/).textContent();
    const duplicateOpportunityNumber = errorMessage?.match(/Opportunity with number '(.*)' already exists/)?.[1];
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Opportunities List" })).toBeVisible();
    await expect(page.getByText(duplicateOpportunityNumber || "", { exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Opportunities List" })).toBeVisible();

    // --- Step 5: Create Opportunity with invalid Assistance Listing Number ---
    await page.locator("a.usa-button", { hasText: "Create Opportunity" }).click();
    await waitForElementVisible(page, page.getByRole('textbox', { name: 'Opportunity number*' }));
    const invalidAssistanceListingNumber = opportunityFields.find(f => f.key === "assistanceListingNumber")?.fill?.invalid || "000000";
    const firstPageFields_Invalid_Assistance = {
      opportunityNumber: filteredCreateOpportunityFillData.opportunityNumber + "-2",
      opportunityTitle: filteredCreateOpportunityFillData.opportunityTitle,
      grantSelectionMethod: filteredCreateOpportunityFillData.grantSelectionMethod,
      assistanceListingNumber: invalidAssistanceListingNumber,
    };
    await fillOpportunityPage(testInfo, page, opportunityPageConfig, firstPageFields_Invalid_Assistance);
    await expect(page.getByRole("heading", { name: "Error" })).toBeVisible();
    await expect(page.getByText(new RegExp(`Could not find Assistance Listing Number ${invalidAssistanceListingNumber}`))).toBeVisible();

    // --- Step 6: Character limit validation tests ---
    for (const field of opportunityFields) {
      if (field.characterLimit) {
        await testCharacterLimit(
          page,
          field.definition.label,
          field.characterLimit.invalid,
          `${field.characterLimit.overLimitCount} character over limit`
        );
      }
    }
  }
);

