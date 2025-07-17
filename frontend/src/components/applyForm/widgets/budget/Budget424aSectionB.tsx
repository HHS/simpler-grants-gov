/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/templates/BaseInputTemplate.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { get } from "lodash";
import { Table } from "@trussworks/react-uswds";

import { UswdsWidgetProps } from "src/components/applyForm/types";
import TextWidget from "src/components/applyForm/widgets/TextWidget";

/** The `TextWidget` component uses the `BaseInputTemplate`.
 *
 * @param props - The `WidgetProps` for this component
 */
function Budget424aSectionB<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({ id, schema, value = [], rawErrors }: UswdsWidgetProps<T, S, F>) {
  const { description } = schema as S;
  const schemaItems = schema.items as {
    properties: {
      activity_title: object;
      assistance_listing_number: object;
      budget_summary: {
        allOf: [
          {
            properties: {
              federal_estimated_unobligated_amount: { allOf: [object] };
              non_federal_estimated_unobligated_amount: { allOf: [object] };
              federal_new_or_revised_amount: { allOf: [object] };
              non_federal_new_or_revised_amount: { allOf: [object] };
              total_amount: { allOf: [object] };
            };
          },
        ];
      };
    };
  };

  const errors = rawErrors as [Record<string, unknown>];
  const tableValues = value as Record<string, unknown>[];

  // TODO: use json pointer / ref for this
  const activityTitleSchema = schemaItems.properties.activity_title;
  const assistanceListingNumberSchema =
    schemaItems.properties.assistance_listing_number;
  const budgetSummarySchema = schemaItems.properties.budget_summary;
  const federalEstimatedUnobligatedAmountSchema =
    budgetSummarySchema.allOf[0].properties.federal_estimated_unobligated_amount
      .allOf[0];
  const nonFederalEstimatedUnobligatedAmountSchema =
    budgetSummarySchema.allOf[0].properties
      .non_federal_estimated_unobligated_amount.allOf[0];
  const federalnewOrRevisedAmountSchema =
    budgetSummarySchema.allOf[0].properties.federal_new_or_revised_amount
      .allOf[0];
  const nonFederalNewOrRevisedAmountSchema =
    budgetSummarySchema.allOf[0].properties.non_federal_new_or_revised_amount
      .allOf[0];
  const totalAmountSchema =
    budgetSummarySchema.allOf[0].properties.total_amount.allOf[0];


    console.log('sadfsdsd', value)
  return (
    <div key={id} id={id}>
      <p>{description}</p>
      <Table>
        <thead>
          <tr>
            <td></td>
            <td>1</td>
            <td>2</td>
            <td>3</td>
            <td>4</td>
            <td>5</td>
            <td>Category total(sum of 1-4)5</td>
          </tr>
        </thead>
        <tbody>
          <tr><td>6. Object Categories</td></tr>
          <tr><td>a. Personal</td>
             {Array.from({ length: 4 }).map((_, row) => (
              <td key={`${id}_row_${row}_activity_title`}>
                <TextWidget
                  schema={activityTitleSchema}
                  id={`activity_line_items[${row}].budget_categories.personnel_amount`}
                  rawErrors={getErrors({
                    errors,
                    row,
                    key: "personnel_amount",
                  })}
                  value={get(value, `[${row}].budget_categories.personnel_amount`)}
                />
              </td>
             ))}

              </tr>
  
        </tbody>
      </Table>
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

export default Budget424aSectionB;
