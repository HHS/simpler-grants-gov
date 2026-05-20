
import { Page, TestInfo } from "@playwright/test";
import { fillPagePartial, type PageFillFieldDefinitions } from "tests/e2e/utils/page/general-page-filling";

/**
 * Timeout for save button actions (30s accommodates slow CI/staging environments)
 */
const SAVE_TIMEOUT = 30000;

/**
 * Definition for a single Opportunity field (used for Playwright form filling)
 */
export interface OpportunityFieldDefinition {
  testId?: string;
  selector?: string;
  label?: string;
  getByText?: string;
  textExact?: boolean;
  hasTextRegex?: string;
  type: "text" | "dropdown" | "file" | "checkbox";
  field: string;
}

/**
 * Map of field keys to OpportunityFieldDefinition
 */
export type OpportunityPageDefinitions = Record<string, OpportunityFieldDefinition>;

/**
 * Page config for Opportunity form (field definitions and save button testId)
 */
export interface OpportunityPageConfig {
  fields: PageFillFieldDefinitions;
  saveButtonTestId: string;
}

/**
 * Fills the Opportunity page form and clicks save.
 * Attaches start and complete logs to the testInfo for traceability.
 */
export async function fillOpportunityPage(
  testInfo: TestInfo,
  page: Page,
  config: OpportunityPageConfig,
  pageData: Record<string, string | boolean>,
): Promise<void> {
  await testInfo.attach("fillOpportunityPage-start", {
    body: `Filling ${Object.keys(pageData).length} opportunity fields`,
    contentType: "text/plain",
  });

  await fillPagePartial(testInfo, page, config.fields, pageData);

  // Prefer testId, fallback to role-based selector for Save button
  const saveButton = page
    .getByTestId(config.saveButtonTestId)
    .or(page.getByRole("button", { name: /save/i }).first());
  await saveButton.waitFor({ state: "visible", timeout: SAVE_TIMEOUT });

  // Optionally wait for page stability before clicking (uncomment if needed)
  // await page.waitForTimeout(1000);
  await saveButton.click();

  await testInfo.attach("fillOpportunityPage-complete", {
    body: "Opportunity page filled and saved",
    contentType: "text/plain",
  });
}
