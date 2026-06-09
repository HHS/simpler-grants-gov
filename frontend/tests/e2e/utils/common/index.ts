// index.ts
// Shared common utilities and re-exports for E2E helper modules.
import { formatNumberWithCommas } from "./number-formatters";

export { fillTextareaByLabel } from "./text-handler";
export { fillEmailByLabel } from "./email-field";
export { selectOptionByLabel } from "./select-field";
export { fillDateByLabel } from "./date-field";
export { assertButtonEnabledDisabledStates } from "./button-state-assertions";
export { assertActionsColumnLinksByStatus } from "./actions-column-assertions";
export {
  assertLocatorVisible,
  assertPageDetailsVisible,
  assertTextVisible,
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
