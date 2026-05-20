
import { opportunityFields } from "./opportunity-fields-unified";

/**
 * opportunityPageConfig
 * - Maps field keys to their definitions for easy lookup in tests.
 * - Centralizes the testID for the save button.
 */
export const opportunityPageConfig = {
  /**
   * Field definitions indexed by key, e.g. fields['opportunityNumber']
   */
  fields: Object.fromEntries(
    opportunityFields.map(field => [field.key, field.definition])
  ),

  /**
   * Test ID for the Save button on the Opportunity page
   */
  saveButtonTestId: "save-button",
};
