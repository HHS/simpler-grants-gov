// index.ts
// Shared re-exports for common E2E helper modules.
// Usage: import { ... } from "tests/e2e/utils/common";
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

// Generic shared utilities.
export { formatNumberWithCommas };
export { runSharedFieldFill } from "./shared-field-filling";
export { runFieldFillBatch } from "./field-batch-filling";

// Metadata-driven page utilities.
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

// Opportunity-specific validation helpers.
export {
  assertCharacterLimitMessageCount,
  buildOverLimitOpportunityFillData,
  getCharacterLimitValidationMessage,
  getCharacterLimitedOpportunityFields,
} from "./character-limit-fill-data-utils";
export {
  fillRequiredFieldsAndAssertButtonState,
  getRequiredOpportunityFields,
} from "./required-fields-button-state-utils";
