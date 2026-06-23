/**
 * Shared re-exports for common E2E helper modules.
 * Usage: import { ... } from "tests/e2e/utils/common";
 *
 * Table-row API guidance:
 * - Prefer waitForRowByColumns for most list-page scenarios.
 * - Use waitForRowByColumnPair when exactly two filters improve readability.
 */
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
export { formatNumberWithCommas } from "./number-formatters";
export { runSharedFieldFill } from "./shared-field-filling";
export { runFieldFillBatch } from "./field-batch-filling";
export { fieldHandlerMap } from "./field-handler-dispatcher";

// Table row interaction helpers.
// Neutral row matching and row navigation APIs.
export {
  clickRowLinkByText,
  waitForSearchResultsReady,
  waitForRowByColumnPair,
  waitForRowByColumns,
} from "./table-row-utils";
