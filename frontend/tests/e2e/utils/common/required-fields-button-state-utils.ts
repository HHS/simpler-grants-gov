import { type Page, type TestInfo } from "@playwright/test";
import {
  buildPageFieldsFromDefinitions,
  type OpportunityFieldValueKey,
  type OpportunityPageFieldDefinition,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
import { fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";

import { assertButtonEnabledDisabledStates } from "./button-state-assertions";

/** Returns only create-opportunity fields marked as required in metadata. */
export const getRequiredOpportunityFields = (
  definitions: OpportunityPageFieldDefinition[],
): OpportunityPageFieldDefinition[] => {
  return definitions.filter((field) => field.required);
};

/**
 * Fills required fields one by one and validates button states after each step.
 *
 * This helper supports progressive Save/Cancel gating assertions while keeping
 * field-filling logic metadata-driven.
 */
export const fillRequiredFieldsAndAssertButtonState = async (
  page: Page,
  definitions: OpportunityPageFieldDefinition[],
  fillData: Record<OpportunityFieldValueKey, string>,
  testInfo: TestInfo | undefined,
  options: {
    overridesByValueKey?: Partial<Record<OpportunityFieldValueKey, string>>;
    buttonStatesByStep: (
      isAllRequiredFieldsFilled: boolean,
    ) => Record<string, boolean>;
  },
): Promise<void> => {
  const requiredFields = getRequiredOpportunityFields(definitions);
  const mergedFillData = {
    ...fillData,
    ...(options.overridesByValueKey ?? {}),
  } as Record<OpportunityFieldValueKey, string>;

  // Fill one required field per step and validate expected button states.
  for (let i = 0; i < requiredFields.length; i++) {
    await fillPageFields(
      page,
      buildPageFieldsFromDefinitions([requiredFields[i]], mergedFillData),
    );

    const isAllRequiredFieldsFilled = i === requiredFields.length - 1;
    await assertButtonEnabledDisabledStates(page, {
      ...options.buttonStatesByStep(isAllRequiredFieldsFilled),
    });
  }
};
