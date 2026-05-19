import { Page, TestInfo } from "@playwright/test";
import {
  fillPagePartial,
  type PageFillFieldDefinitions,
} from "tests/e2e/utils/page/general-page-filling";

// 30s accommodates both staging (slow under load) and Mobile Chrome in CI.
const SAVE_TIMEOUT = 30000;

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

export type OpportunityPageDefinitions = {
  [fieldIdentifier: string]: OpportunityFieldDefinition;
};

export interface OpportunityPageConfig {
  fields: PageFillFieldDefinitions;
  saveButtonTestId: string;
}

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

  const saveButton = page
    .getByTestId(config.saveButtonTestId)
    .or(page.getByRole("button", { name: /save/i }).first());
  await saveButton.waitFor({ state: "visible", timeout: SAVE_TIMEOUT });
  await saveButton.click();

  await testInfo.attach("fillOpportunityPage-complete", {
    body: "Opportunity page filled and saved",
    contentType: "text/plain",
  });
}
