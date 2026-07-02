import { type PageFillField } from "tests/e2e/utils/pages/general-pages-filling";

import {
  type FieldValue,
  type MetadataPageFieldDefinition,
} from "./types";

/** Builds page-fill fields from metadata definitions and a value dictionary. */
export const buildPageFieldsFromDefinitions = <TValueKey extends string>(
  definitions: MetadataPageFieldDefinition<TValueKey>[],
  fillData: Record<TValueKey, FieldValue>,
): PageFillField[] => {
  // Keep metadata-to-runtime mapping in one place so domain fixtures stay declarative.
  return definitions.map((definition) => ({
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
