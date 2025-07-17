/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/templates/BaseInputTemplate.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";

import ApplyFormNav from "src/components/applyForm/ApplyFormNav";
import { UswdsWidgetProps } from "src/components/applyForm/types";
import Budget424aSectionA from "./Budget424aSectionA";

/** The `TextWidget` component uses the `BaseInputTemplate`.
 *
 * @param props - The `WidgetProps` for this component
 */
function Budget424a<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({ id, schema, value = [], rawErrors }: UswdsWidgetProps<T, S, F>) {
  const navFields = [
    {
      text: "Section A",
      href: "#",
    },
  ];

  return (
    <div id={id}>
      <ApplyFormNav title={"Yolo"} fields={navFields} />
      <Budget424aSectionA
        id="SectionA"
        value={
          typeof value === "object" &&
          value !== null &&
          "activity_line_items" in value
            ? (value as { activity_line_items?: unknown }).activity_line_items
            : undefined
        }
        schema={schema}
        rawErrors={rawErrors}
      />
    </div>
  );
}

export const getValue = <T extends Record<string, unknown>>({
  key,
  row,
  tableValues,
}: {
  key: string;
  row: number;
  tableValues: Array<T>;
}): string => {
  if (
    tableValues.length > 0 &&
    tableValues.length > row &&
    tableValues[row] &&
    typeof tableValues[row][key] === "string"
  ) {
    return tableValues[row][key];
  }
  return "";
};

export const getErrors = ({
  key,
  row,
  errors,
}: {
  key: string;
  row: number;
  errors: [Record<string, unknown>];
}) => {
  if (
    errors.length > 0 &&
    errors.length >= row &&
    errors[row] &&
    Object.prototype.hasOwnProperty.call(errors[row], key) &&
    typeof errors[row][key] === "string"
  ) {
    return [errors[row][key]];
  } else {
    return [];
  }
};

export default Budget424a;
