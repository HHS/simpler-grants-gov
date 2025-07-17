/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/templates/BaseInputTemplate.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";

import { Table } from "@trussworks/react-uswds";

import { UswdsWidgetProps } from "src/components/applyForm/types";
import TextWidget from "src/components/applyForm/widgets/TextWidget";

/** The `TextWidget` component uses the `BaseInputTemplate`.
 *
 * @param props - The `WidgetProps` for this component
 */
function Budget424aSectionA<
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

  return (
    <div key={id} id={id}>
      <p>{description}</p>
      <Table>
        <thead>
          <tr>
            <td>Grant program, function, or activity</td>
            <td>Assistance listing number</td>
            <td>Federal</td>
            <td>Non-federal</td>
            <td>Federal</td>
            <td>Non-federal</td>
            <td>Total(sum of C-F)</td>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 4 }).map((_, row) => (
            <tr key={row}>
              <td key={`${id}_row_${row}_activity_title`}>
                {row + 1}.
                <TextWidget
                  schema={activityTitleSchema}
                  id={`${id}[${row}].activity_title`}
                  rawErrors={getErrors({
                    errors,
                    row,
                    key: "activity_title",
                  })}
                  value={getValue({
                    tableValues,
                    row,
                    key: "activity_title",
                  })}
                />
              </td>
              <td key={`${id}_row_${row}_assistance_listing_number`}>
                <TextWidget
                  schema={assistanceListingNumberSchema}
                  id={`${id}[${row}].assistance_listing_number`}
                  rawErrors={getErrors({
                    errors,
                    row,
                    key: "assistance_listing_number",
                  })}
                  value={getValue({
                    tableValues,
                    row,
                    key: "assistance_listing_number",
                  })}
                />
              </td>
              <td
                key={`${id}}_row_${row}_federal_estimated_unobligated_amount`}
              >
                <TextWidget
                  schema={federalEstimatedUnobligatedAmountSchema}
                  id={`${id}[${row}].federal_estimated_unobligated_amount`}
                  rawErrors={getErrors({
                    errors,
                    row,
                    key: "federal_estimated_unobligated_amount",
                  })}
                  value={getValue({
                    tableValues,
                    row,
                    key: "federal_estimated_unobligated_amount",
                  })}
                />
              </td>
              <td
                key={`${id}_row_${row}_non_federal_estimated_unobligated_amount`}
              >
                <TextWidget
                  schema={nonFederalEstimatedUnobligatedAmountSchema}
                  id={`${id}[${row}].non_federal_estimated_unobligated_amount`}
                  rawErrors={getErrors({
                    errors,
                    row,
                    key: "non_federal_estimated_unobligated_amount",
                  })}
                  value={getValue({
                    tableValues,
                    row,
                    key: "non_federal_estimated_unobligated_amount",
                  })}
                />
              </td>
              <td key={`${id}_row_${row}_federal_new_or_revised_amount`}>
                <TextWidget
                  schema={federalnewOrRevisedAmountSchema}
                  id={`${id}[${row}].federal_new_or_revised_amount`}
                  rawErrors={getErrors({
                    errors,
                    row,
                    key: "federal_new_or_revised_amount",
                  })}
                  value={getValue({
                    tableValues,
                    row,
                    key: "federal_new_or_revised_amount",
                  })}
                />
              </td>
              <td key={`${id}_row_${row}_non_federal_new_or_revised_amount`}>
                <TextWidget
                  schema={nonFederalNewOrRevisedAmountSchema}
                  id={`${id}[${row}].non_federal_new_or_revised_amount`}
                  rawErrors={getErrors({
                    errors,
                    row,
                    key: "non_federal_new_or_revised_amount",
                  })}
                  value={getValue({
                    tableValues,
                    row,
                    key: "non_federal_new_or_revised_amount",
                  })}
                />
              </td>
              <td key={`${id}_row_${row}_total_amount`}>
                <TextWidget
                  schema={totalAmountSchema}
                  id={`${id}[${row}].total_amount`}
                  rawErrors={getErrors({
                    errors,
                    row,
                    key: "total_amount",
                  })}
                  value={getValue({
                    tableValues,
                    row,
                    key: "total_amount",
                  })}
                />
              </td>
            </tr>
          ))}
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
}): string | number => {
  if (
    tableValues.length > 0 &&
    tableValues.length > row &&
    tableValues[row] &&
    (typeof tableValues[row][key] === "string" || typeof tableValues[row][key] === "number")
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

export default Budget424aSectionA;
