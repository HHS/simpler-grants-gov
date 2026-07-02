import { expect, type Page } from "@playwright/test";
import {
  buildPageFieldsFromDefinitions,
  CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
  type OpportunityFieldValueKey,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";

/**
 * Creates a new opportunity from the opportunities list and submits the create form.
 *
 * @param page Playwright page instance.
 * @param fillData Field values mapped by opportunity metadata keys.
 */
export async function createOpportunity(
  page: Page,
  fillData: Record<OpportunityFieldValueKey, string>,
): Promise<void> {
  // Given I navigate to the opportunities list.
  await page.goto("/grantor/opportunities");
  await expect(page).toHaveURL(/\/grantor\/opportunities/);

  // When I start creating a new opportunity.
  await page.getByRole("link", { name: "Create Opportunity" }).click();
  await expect(page).toHaveURL(/\/grantor\/opportunities\/create/);

  // And I fill required create-opportunity fields.
  await fillPageFields(
    page,
    buildPageFieldsFromDefinitions(
      CREATE_OPPORTUNITY_FIELD_DEFINITIONS,
      fillData,
    ),
  );

  const saveAndContinueButton = page.getByRole("button", {
    name: "Save and continue",
  });
  await expect(saveAndContinueButton).toBeEnabled();
  await saveAndContinueButton.click();
}
