/**
 * Shared setup helpers for edit-opportunity failure-path scenarios.
 *
 * Reviewer guide (what logic):
 * 1. Open edit opportunity flow from create.
 * 2. Fill required fields for the scenario.
 * 3. Assert Save-and-* button baseline states.
 *
 * Tester parameter guide (what to update):
 * - fillData controls seeded values used for create + edit setup.
 * - requiredFieldDefinitions controls fields primed before validation checks.
 */
import { expect, type Page } from "@playwright/test";
import {
  buildPageFieldsFromDefinitions,
  type OpportunityFieldValueKey,
  type OpportunityPageFieldDefinition,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { assertButtonEnabledDisabledStates } from "tests/e2e/utils/common/index";
import { fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";

import { createOpportunity } from "./create-opportunity-utils";

export const EDIT_OPPORTUNITY_URL_PATTERN =
  /\/grantor\/opportunity\/[0-9a-f-]{36}\/edit(?:\?.*)?$/i;

export async function openEditOpportunityFromCreate(
  page: Page,
  fillData: Record<OpportunityFieldValueKey, string>,
): Promise<void> {
  // Opens edit via create flow so all failure-path tests start from one baseline state.
  await createOpportunity(page, fillData);
  await expect(page).toHaveURL(/overview\?fromCreate=true/);
  await page.getByRole("link", { name: "Opportunity Summary" }).click();
  await expect(page).toHaveURL(EDIT_OPPORTUNITY_URL_PATTERN);
}

export async function primeEditOpportunityForPublishChecks(
  page: Page,
  fillData: Record<OpportunityFieldValueKey, string>,
  requiredFieldDefinitions: OpportunityPageFieldDefinition[],
): Promise<void> {
  // Keep requiredFieldDefinitions aligned with current required-field rules.
  await openEditOpportunityFromCreate(page, fillData);
  await fillPageFields(
    page,
    buildPageFieldsFromDefinitions(requiredFieldDefinitions, fillData),
  );
  await assertButtonEnabledDisabledStates(page, {
    "Save and exit": true,
    "Save and go back": true,
    "Save and continue": true,
  });
}
