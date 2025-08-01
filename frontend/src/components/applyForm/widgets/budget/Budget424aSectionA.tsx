/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/templates/BaseInputTemplate.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { get } from "lodash";

import { Table } from "@trussworks/react-uswds";

import {
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import TextWidget from "src/components/applyForm/widgets/TextWidget";

/** The `TextWidget` component uses the `BaseInputTemplate`.
 *
 * @param props - The `WidgetProps` for this component
 */
function Budget424aSectionA<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({ id, value = [], rawErrors }: UswdsWidgetProps<T, S, F>) {
  const errors = rawErrors as FormValidationWarning[];

  // TODO: use json pointer / ref for this
  const activityTitleSchema = {
    type: "string" as const,
    minLength: 0,
    maxLength: 120,
  };
  const assistanceListingNumberSchema = {
    type: "string" as const,
    minLength: 0,
    maxLength: 15,
  };
  const amountSchema = {
    type: "string" as const,
    pattern: "^\\d*([.]\\d{2})?$",
    maxLength: 14,
  };
  const federalEstimatedUnobligatedAmountSchema = amountSchema;
  const nonFederalEstimatedUnobligatedAmountSchema = amountSchema;
  const federalnewOrRevisedAmountSchema = amountSchema;
  const nonFederalNewOrRevisedAmountSchema = amountSchema;
  const totalAmountSchema = amountSchema;

  return (
    <div key={id} id={id}>
      <h3>Instructions</h3>
      <div style={{ columnCount: 2 }}>
        <h4>New applications</h4>
        <p>
          Leave Columns C and D blank. For each line entry in Columns A and B,
          enter in Columns E, F, and G the appropriate amounts of funds needed
          to support the project for the first funding period (usually a year).
        </p>

        <h4>Supplemental grants and changes to existing grants</h4>
        <p>
          Leave Columns C and D blank. In Column E, enter the amount of the
          increase or decrease of Federal funds and enter in Column F the amount
          of the increase or decrease of non-Federal funds. In Column G, enter
          the new total budgeted amount (Federal and non-Federal) which includes
          the total previous authorized budgeted amounts plus or minus, as
          appropriate, the amounts shown in Columns E and F. The amount(s) in
          Column G should not equal the sum of amounts in Columns E and F.
        </p>
        <h4>Continuing grant applications</h4>
        <p>
          In Columns C and D, enter the estimated amounts of funds that will
          remain unobligated at the end of the grant funding period only if the
          Federal grantor agency instructions provide for this. Otherwise, leave
          these columns blank. In Columns E and F, enter the amounts of funds
          needed for the upcoming period. The amount(s) in Column G should be
          the sum of amounts in Columns E and F. Submit these forms before the
          end of each funding period as required by the grantor agency.
        </p>
      </div>
      <Table
        bordered={false}
        className="usa-table--borderless simpler-responsive-table width-full border-1px border-base-light"
      >
        <thead className="text-bold">
          <tr className="bg-base-lighter">
            <td
              className="bg-base-lightest text-bold border-bottom-0 width-card border-base-light"
              rowSpan={2}
            >
              <div>Grant program, function, or activity</div>
            </td>
            <td
              className="bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light"
              rowSpan={2}
            >
              Assistance listing number
            </td>
            <td
              className="bg-base-lightest text-bold border-x-1px border-base-light"
              colSpan={2}
            >
              <span className="text-no-wrap">Estimated unobligated funds</span>
            </td>
            <td
              className="bg-base-lightest text-bold border-x-1px border-base-light"
              colSpan={2}
            >
              New or revised budget
            </td>
            <td
              className="bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light"
              rowSpan={2}
            >
              Total
              <div className="text-normal text-no-wrap text-italic">
                (sum of C-F)
              </div>
            </td>
          </tr>
          <tr>
            <td className="bg-base-lightest text-bold border-bottom-0 border-x-1px border-base-light">
              Federal
            </td>
            <td className="bg-base-lightest text-bold border-bottom-0">
              Non-federal
            </td>
            <td className="bg-base-lightest text-bold border-bottom-0 border-x-1px border-base-light">
              Federal
            </td>
            <td className="bg-base-lightest text-bold border-bottom-0">
              Non-federal
            </td>
          </tr>
          <tr className="bg-base-lightest text-bold text-center">
            <td className="bg-base-lightest text-bold border-top-0">A</td>
            <td className="bg-base-lightest text-bold border-top-0 border-x-1px border-base-light">
              B
            </td>
            <td className="bg-base-lightest text-bold border-top-0">C</td>
            <td className="bg-base-lightest text-bold border-top-0 border-x-1px border-base-light">
              D
            </td>
            <td className="bg-base-lightest text-bold border-top-0 border-x-1px border-base-light">
              E
            </td>
            <td className="bg-base-lightest text-bold border-top-0">F</td>
            <td className="bg-base-lightest text-bold border-top-0 border-x-1px border-base-light">
              G
            </td>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 4 }).map((_, row) => (
            <tr key={row}>
              <td
                key={`activity_line_items_row_${row}_activity_title`}
                className="border-transparent padding-05"
              >
                <div className="display-flex flex-align-end">
                  <span className="text-bold text-no-wrap margin-bottom-1">
                    {row + 1}.
                  </span>
                  <div>
                    <TextWidget
                      schema={activityTitleSchema}
                      id={`activity_line_items[${row}]--activity_title`}
                      rawErrors={getErrors({
                        errors,
                        id: `activity_line_items[${row}]--activity_title`,
                      })}
                      formClassName="margin-left-2 margin-top-3"
                      inputClassName="minw-15"
                      value={get(value, `[${row}]activity_title`)}
                    />
                  </div>
                </div>
              </td>
              <td
                key={`activity_line_items_row_${row}_assistance_listing_number`}
                className="border-transparent padding-05"
              >
                <TextWidget
                  schema={assistanceListingNumberSchema}
                  id={`activity_line_items[${row}]--assistance_listing_number`}
                  rawErrors={getErrors({
                    errors,
                    id: `activity_line_items[${row}]--assistance_listing_number`,
                  })}
                  formClassName="margin-top-3"
                  inputClassName="minw-10"
                  value={get(value, `[${row}]assistance_listing_number`)}
                />
              </td>
              <td
                key={`activity_line_items_row_${row}_federal_estimated_unobligated_amount`}
                className="border-transparent padding-05"
              >
                <TextWidget
                  schema={federalEstimatedUnobligatedAmountSchema}
                  id={`activity_line_items[${row}]--budget_summary--federal_estimated_unobligated_amount`}
                  rawErrors={getErrors({
                    errors,
                    id: `activity_line_items[${row}]--budget_summary--federal_estimated_unobligated_amount`,
                  })}
                  formClassName="margin-top-3 simpler-currency-input-wrapper"
                  inputClassName="minw-10"
                  value={get(
                    value,
                    `[${row}]budget_summary.federal_estimated_unobligated_amount`,
                  )}
                />
              </td>
              <td
                key={`activity_line_items_row_${row}_non_federal_estimated_unobligated_amount`}
                className="border-transparent padding-05"
              >
                <TextWidget
                  schema={nonFederalEstimatedUnobligatedAmountSchema}
                  id={`activity_line_items[${row}]--budget_summary--non_federal_estimated_unobligated_amount`}
                  rawErrors={getErrors({
                    errors,
                    id: `activity_line_items[${row}]--budget_summary--non_federal_estimated_unobligated_amount`,
                  })}
                  formClassName="margin-top-3 simpler-currency-input-wrapper"
                  inputClassName="minw-10"
                  value={get(
                    value,
                    `[${row}]budget_summary.non_federal_estimated_unobligated_amount`,
                  )}
                />
              </td>
              <td
                key={`activity_line_items_row_${row}_federal_new_or_revised_amount`}
                className="border-transparent padding-05"
              >
                <TextWidget
                  schema={federalnewOrRevisedAmountSchema}
                  id={`activity_line_items[${row}]--budget_summary--federal_new_or_revised_amount`}
                  rawErrors={getErrors({
                    errors,
                    id: `activity_line_items[${row}]--budget_summary--federal_new_or_revised_amount`,
                  })}
                  inputClassName="minw-10"
                  formClassName="margin-top-3 simpler-currency-input-wrapper"
                  value={get(
                    value,
                    `[${row}]budget_summary.federal_new_or_revised_amount`,
                  )}
                />
              </td>
              <td
                key={`activity_line_items_row_${row}_non_federal_new_or_revised_amount`}
                className="border-transparent padding-05"
              >
                <TextWidget
                  schema={nonFederalNewOrRevisedAmountSchema}
                  id={`activity_line_items[${row}]--budget_summary--non_federal_new_or_revised_amount`}
                  rawErrors={getErrors({
                    errors,
                    id: `activity_line_items[${row}]--budget_summary--non_federal_new_or_revised_amount`,
                  })}
                  inputClassName="minw-10"
                  formClassName="margin-top-3 simpler-currency-input-wrapper"
                  value={get(
                    value,
                    `[${row}]budget_summary.non_federal_new_or_revised_amount`,
                  )}
                />
              </td>
              <td
                key={`activity_line_items_row_${row}_total_amount`}
                className="border-transparent padding-0"
              >
                <div className="display-flex flex-align-end">
                  <span className="margin-bottom-1 margin-right-1">=</span>
                  <div>
                    <div className="text-normal text-no-wrap text-italic font-sans-2xs">
                      Sum of row {row + 1}
                    </div>
                    <TextWidget
                      schema={totalAmountSchema}
                      id={`activity_line_items[${row}]--budget_summary--total_amount`}
                      rawErrors={getErrors({
                        errors,
                        id: `activity_line_items[${row}]--budget_summary--total_amount`,
                      })}
                      inputClassName="minw-10 margin-top-0 border-2px"
                      formClassName="margin-top-0 simpler-currency-input-wrapper"
                      value={get(value, `[${row}]budget_summary.total_amount`)}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
          <tr>
            <td className="padding-05 text-bold" colSpan={2}>
              <div className="display-flex">
                <span className="margin-right-5">5.</span>
                <div>
                  Total
                  <div className="text-normal text-no-wrap text-italic">
                    (sum of 1-4)
                  </div>
                </div>
              </div>
            </td>
            <td className="padding-05">
              <div className="text-italic font-sans-2xs text-no-wrap border-top-2px width-full padding-top-2 margin-top-2">
                Sum of column C
              </div>
              <TextWidget
                schema={amountSchema}
                id={
                  "total_budget_summary--federal_estimated_unobligated_amount"
                }
                rawErrors={getErrors({
                  errors,
                  id: "total_budget_summary--federal_estimated_unobligated_amount",
                })}
                formClassName="margin-top-0 simpler-currency-input-wrapper"
                inputClassName="margin-top-0 border-2px"
                value={get(value, "federal_estimated_unobligated_amount")}
              />
            </td>
            <td className="padding-05">
              <div className="text-italic font-sans-2xs text-no-wrap border-top-2px width-full padding-top-2 margin-top-2">
                Sum of column D
              </div>
              <TextWidget
                schema={amountSchema}
                id={
                  "total_budget_summary.non_federal_estimated_unobligated_amount"
                }
                rawErrors={getErrors({
                  errors,
                  id: "total_budget_summary.non_federal_estimated_unobligated_amount",
                })}
                formClassName="margin-top-0 simpler-currency-input-wrapper"
                inputClassName="margin-top-0 border-2px"
                value={get(value, "non_federal_estimated_unobligated_amount")}
              />
            </td>
            <td className="padding-05">
              <div className="text-italic font-sans-2xs text-no-wrap border-top-2px width-full padding-top-2 margin-top-2">
                Sum of column E
              </div>
              <TextWidget
                schema={amountSchema}
                id={"total_budget_summary.federal_new_or_revised_amount"}
                rawErrors={getErrors({
                  errors,
                  id: "total_budget_summary.federal_new_or_revised_amount",
                })}
                formClassName="margin-top-0 simpler-currency-input-wrapper"
                inputClassName="margin-top-0 border-2px"
                value={get(value, "federal_new_or_revised_amount")}
              />
            </td>
            <td className="padding-05">
              <div className="text-italic font-sans-2xs text-no-wrap border-top-2px width-full padding-top-2 margin-top-2">
                Sum of column F
              </div>
              <TextWidget
                schema={amountSchema}
                id={"total_budget_summary.non_federal_new_or_revised_amount"}
                rawErrors={getErrors({
                  errors,
                  id: "total_budget_summary.non_federal_new_or_revised_amount",
                })}
                formClassName="margin-top-0 simpler-currency-input-wrapper"
                inputClassName="margin-top-0 border-2px"
                value={get(value, "non_federal_new_or_revised_amount")}
              />
            </td>
            <td className="padding-05">
              <div className="text-italic font-sans-2xs text-no-wrap border-top-2px width-full padding-top-2 margin-top-2">
                Sum of column G
              </div>
              <TextWidget
                schema={amountSchema}
                formClassName="margin-top-0 simpler-currency-input-wrapper"
                inputClassName="margin-top-0 border-2px"
                id={"total_budget_summary.total_amount"}
                rawErrors={getErrors({
                  errors,
                  id: "total_budget_summary.total_amount",
                })}
                value={get(value, "total_amount")}
              />
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export const getErrors = ({
  errors,
  id,
}: {
  id: string;
  errors: FormValidationWarning[];
}) => {
  if (!errors) return [];
  return errors
    .filter((error) => error.field === id)
    .map((error) => error.message);
};

export default Budget424aSectionA;
