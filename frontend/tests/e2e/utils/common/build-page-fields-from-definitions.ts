import { type PageFillField } from "tests/e2e/utils/pages/general-pages-filling";

import { type FieldValue, type MetadataPageFieldDefinition } from "./types";

/**
 * Shared mapper from metadata definitions to runtime page-fill fields.
 *
 * How this file works:
 * - Accepts metadata definitions (labels, selectors, types, dependencies).
 * - Reads runtime values from the keyed fill-data object.
 * - Produces PageFillField records consumed by shared fill helpers.
 */

/** Builds page-fill fields from metadata definitions and a value dictionary. */
export const buildPageFieldsFromDefinitions = <TValueKey extends string>(
  definitions: MetadataPageFieldDefinition<TValueKey>[],
  fillData: Record<TValueKey, FieldValue>,
): PageFillField[] => {
  // Keep metadata-to-runtime mapping in one place so domain fixtures stay declarative.
  return definitions.map((definition) => ({
    // Field identity and value resolution.
    field: definition.label,
    type: definition.type,
    value: fillData[definition.valueKey],
    label: definition.label,
    labelExact: definition.exact,
    selector: definition.selector,
    selectFirstInGroup: definition.selectFirstInGroup,
    testId: definition.testId,
    optionTestIdPrefix: definition.optionTestIdPrefix,
    getByText: definition.getByText,
    textExact: definition.textExact,
    useDataAsText: definition.useDataAsText,
    hasTextRegex: definition.hasTextRegex,
    section: definition.section,
    printTestId: definition.printTestId,
    maxLength: definition.maxLength,
    dependsOn: definition.dependsOn,
  }));
};
