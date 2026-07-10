/**
 * Shared re-export surface for common E2E helper modules.
 *
 * Import pattern:
 * import { ... } from "tests/e2e/utils/common";
 *
 * Sections in this file:
 * - Field interaction helpers.
 * - Assertion helpers.
 * - Generic shared helpers.
 * - Metadata-driven page utilities.
 * - Metadata-driven validation helpers.
 */
import { formatNumberWithCommas } from "./number-formatters";

// Field interaction helpers.
export { fillEmailByLabel } from "./email-field";
export { selectOptionByLabel } from "./select-field";
export { fillDateByLabel } from "./date-field";

// Assertion helpers.
export { assertButtonEnabledDisabledStates } from "./button-state-assertions";
export { assertActionsColumnLinksByStatus } from "./actions-column-assertions";
export {
  assertPageHeadingAndTextsVisible,
  assertPageDetailsVisible,
  assertTextVisible,
  assertTextsVisibleOnPage,
} from "./visibility-assertions";

// Generic shared helpers used across page flows and fixtures.
export { formatNumberWithCommas };
export { runSharedFieldFill } from "./shared-field-filling";
export { runFieldFillBatch } from "./field-batch-filling";
export { buildPageFieldsFromDefinitions } from "./build-page-fields-from-definitions";

// Metadata-driven page utilities for reset/clear and duplicate-data assertions.
export {
  buildEmptyFillDataFromDefinitions,
  clearPageFieldsFromDefinitions,
} from "./clear-fields-utils";
export {
  assertDuplicateValidationMessages,
  buildDuplicateDataRegex,
  buildDuplicateDataRegexForField,
  buildDuplicateDataRegexesForDefinitions,
  buildDuplicateDataRegexFromDefinitions,
} from "./duplicate-data-validation-utils";

// Metadata-driven validation helpers and required-field gating helpers.
export {
  assertCharacterLimitMessageCount,
  buildOverLimitFillData,
  getCharacterLimitValidationMessage,
  getCharacterLimitedFields,
} from "./character-limit-fill-data-utils";
export { getRequiredFields } from "./required-fields-button-state-utils";
export { fillRequiredFieldsAndAssertButtonState } from "./required-fields-button-state-utils";
