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
function Budget424aTotalBudgetSummary<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({ id, schema, value, rawErrors }: UswdsWidgetProps<T, S, F>) {
  const { description } = schema as S;

  const fieldSchema = {
    maxLength: 14,
    pattern: "^\\d*([.]\\d{2})?$",
  };

  return (
    <div key={id} id={id}>
      <p>{description}</p>
      <Table>
        <tbody>
          <tr>
            <td colSpan={2}>5. Total (sum of 1 - 4) </td>
            <td>
              <TextWidget
                schema={{ ...fieldSchema, ...{ title: "Sum of column C" } }}
                id={"total_budget_summary.federal_estimated_unobligated_amount"}
                rawErrors={rawErrors}
                value={get(value, "federal_estimated_unobligated_amount")}
              />
            </td>
            <td>
              <TextWidget
                schema={{ ...fieldSchema, ...{ title: "Sum of column D" } }}
                id={
                  "total_budget_summary.non_federal_estimated_unobligated_amount"
                }
                rawErrors={rawErrors}
                value={get(value, "non_federal_estimated_unobligated_amount")}
              />
            </td>
            <td>
              <TextWidget
                schema={{ ...fieldSchema, ...{ title: "Sum of column E" } }}
                id={"total_budget_summary.federal_new_or_revised_amount"}
                rawErrors={rawErrors}
                value={get(value, "federal_new_or_revised_amount")}
              />
            </td>
            <td>
              <TextWidget
                schema={{ ...fieldSchema, ...{ title: "Sum of column F" } }}
                id={"total_budget_summary.non_federal_new_or_revised_amount"}
                rawErrors={rawErrors}
                value={get(value, "non_federal_new_or_revised_amount")}
              />
            </td>
            <td>
              <TextWidget
                schema={{ ...fieldSchema, ...{ title: "Sum of column G" } }}
                id={"total_budget_summary.total_amount"}
                rawErrors={rawErrors}
                value={get(value, "total_amount")}
              />
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default Budget424aTotalBudgetSummary;
