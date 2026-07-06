/**
 * Shared helper utilities for required-field gating checks.
 *
 * How this file works:
 * - Extract required fields from metadata definitions.
 * - Fill required fields incrementally.
 * - Assert trigger/additional button states after each fill step.
 */
import { type Page } from "@playwright/test";
import { fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";

import { buildPageFieldsFromDefinitions } from "./build-page-fields-from-definitions";
import { assertButtonEnabledDisabledStates } from "./button-state-assertions";
import { type FieldValue, type MetadataPageFieldDefinition } from "./types";

/** Required-field gating expects shared metadata shape with `required` and `valueKey`. */
type RequiredFieldDefinition<TValueKey extends string = string> =
  MetadataPageFieldDefinition<TValueKey>;

/** Returns only fields marked as required in metadata. */
export const getRequiredFields = <
  TValueKey extends string,
  TDefinition extends RequiredFieldDefinition<TValueKey>,
>(
  definitions: TDefinition[],
): TDefinition[] => {
  return definitions.filter((field) => field.required);
};

/**
 * Fills required fields one by one and validates button states after each step.
 *
 * This helper supports progressive Save/Cancel gating assertions while keeping
 * field-filling logic metadata-driven.
 */
export const fillRequiredFieldsAndAssertButtonState = async <
  TValueKey extends string,
  TDefinition extends RequiredFieldDefinition<TValueKey>,
>(
  page: Page,
  definitions: TDefinition[],
  fillData: Record<TValueKey, FieldValue>,
  options: {
    triggerButtonName: string;
    overridesByValueKey?: Partial<Record<TValueKey, FieldValue>>;
    additionalButtonStates?: Record<string, boolean>;
  },
): Promise<void> => {
  // Shared required-field subset used for progressive gating assertions.
  const requiredFields = getRequiredFields(definitions);

  // Allows test-specific overrides without mutating the base fixture fill data.
  const mergedFillData = {
    ...fillData,
    ...(options.overridesByValueKey ?? {}),
  };

  // Fill one required field per step to model real user progression.
  for (let i = 0; i < requiredFields.length; i++) {
    await fillPageFields(
      page,
      buildPageFieldsFromDefinitions([requiredFields[i]], mergedFillData),
    );

    // Trigger button stays disabled until the final required field is filled.
    // Additional button states are asserted on every step for full gating coverage.
    const isAllRequiredFieldsFilled = i === requiredFields.length - 1;
    await assertButtonEnabledDisabledStates(page, {
      [options.triggerButtonName]: isAllRequiredFieldsFilled,
      ...(options.additionalButtonStates ?? {}),
    });
  }
};
