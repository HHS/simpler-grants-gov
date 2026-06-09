// index.ts
// Shared re-exports for common E2E helper modules.
// Usage: import { ... } from "tests/e2e/utils/common";
import { formatNumberWithCommas } from "./number-formatters";

export { fillTextareaByLabel } from "./text-handler";
export { fillEmailByLabel } from "./email-field";
export { selectOptionByLabel } from "./select-field";
export { fillDateByLabel } from "./date-field";
export { assertButtonEnabledDisabledStates } from "./button-state-assertions";
export { assertActionsColumnLinksByStatus } from "./actions-column-assertions";
export {
  assertLocatorVisible,
  assertPageHeadingAndTextsVisible,
  assertPageDetailsVisible,
  assertTextVisible,
  assertTextsVisibleOnPage,
} from "./visibility-assertions";
export { formatNumberWithCommas };
export { runSharedFieldFill } from "./shared-field-filling";
export { runFieldFillBatch } from "./field-batch-filling";
export { fieldHandlerDispatcher } from "./field-handler-dispatcher";
export {
  clickRowTitle,
  waitForOpportunityRowByStatus,
  waitForTableRow,
} from "./table-row-utils";
