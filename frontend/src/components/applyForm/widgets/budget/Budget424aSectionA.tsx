"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";

import React, { JSX } from "react";
import { Table } from "@trussworks/react-uswds";

import {
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import TextWidget from "src/components/applyForm/widgets/TextWidget";
import {
  ACTIVITY_ITEMS,
} from "./budgetConstants";
import { getErrorsForSection } from "./budgetErrors";
import {
  activityTitleSchema,
  assistanceListingNumberSchema,
} from "./budgetSchemas";
import { BaseActivityItem, MoneyString } from "./budgetTypes";
import { CurrencyInput, DataCell, HelperText } from "./budgetUiComponents";
import { asMoney, isRecord } from "./budgetValueGuards";

interface BudgetSummary {
  federal_estimated_unobligated_amount?: MoneyString;
  non_federal_estimated_unobligated_amount?: MoneyString;
  federal_new_or_revised_amount?: MoneyString;
  non_federal_new_or_revised_amount?: MoneyString;
  total_amount?: MoneyString;
}

interface ActivityItem extends BaseActivityItem {
  budget_summary?: BudgetSummary;
}

type NormalizedA = {
  items: ActivityItem[];
  totals?: BudgetSummary;
};

function pickBudgetSummary(value: unknown): BudgetSummary {
  if (!isRecord(value)) return {};
  return {
    federal_estimated_unobligated_amount: asMoney(
      value.federal_estimated_unobligated_amount,
    ),
    non_federal_estimated_unobligated_amount: asMoney(
      value.non_federal_estimated_unobligated_amount,
    ),
    federal_new_or_revised_amount: asMoney(value.federal_new_or_revised_amount),
    non_federal_new_or_revised_amount: asMoney(
      value.non_federal_new_or_revised_amount,
    ),
    total_amount: asMoney(value.total_amount),
  };
}

function pickActivityItemA(value: unknown): ActivityItem {
  if (!isRecord(value)) return {};
  const out: ActivityItem = {};
  if (typeof value.activity_title === "string") {
    out.activity_title = value.activity_title;
  }
  if (typeof value.assistance_listing_number === "string") {
    out.assistance_listing_number = value.assistance_listing_number;
  }
  if (isRecord(value.budget_summary)) {
    out.budget_summary = pickBudgetSummary(value.budget_summary);
  }
  return out;
}

function normalizeSectionAValue(raw: unknown): NormalizedA {
  if (isRecord(raw) && Array.isArray(raw.activity_line_items)) {
    return {
      items: raw.activity_line_items.map(pickActivityItemA),
      totals: pickBudgetSummary(raw.total_budget_summary),
    };
  }

  if (isRecord(raw)) {
    const items: ActivityItem[] = [];
    for (let i = 0; i < 4; i++) {
      items.push(pickActivityItemA(raw[String(i)]));
    }

    const totals =
      pickBudgetSummary(raw.total_budget_summary) || pickBudgetSummary(raw);

    const hasAnyTotal =
      totals.federal_estimated_unobligated_amount ||
      totals.non_federal_estimated_unobligated_amount ||
      totals.federal_new_or_revised_amount ||
      totals.non_federal_new_or_revised_amount ||
      totals.total_amount;

    return { items, totals: hasAnyTotal ? totals : undefined };
  }

  return { items: [] };
}

function Budget424aSectionA<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  value,
  rawErrors,
  formContext,
}: UswdsWidgetProps<T, S, F>): JSX.Element {
  const rootFormDataFromContext = (
    formContext as { rootFormData?: unknown } | undefined
  )?.rootFormData;
  const rawValue: unknown = rootFormDataFromContext ?? value ?? {};
  const errors = (rawErrors as FormValidationWarning[]) || [];
  const { items, totals } = normalizeSectionAValue(rawValue);
  const getErrorsA = getErrorsForSection("A");
  const itemAt = (row: number): ActivityItem => items[row] ?? {};
  const getItemVal = (
    row: number,
    path: keyof ActivityItem,
  ): string | undefined => itemAt(row)[path] as string | undefined;
  const getBudgetVal = (
    row: number,
    path: keyof BudgetSummary,
  ): string | undefined => itemAt(row).budget_summary?.[path];

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
        className="sf424__table usa-table--borderless width-full border-1px border-base-light"
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
          {ACTIVITY_ITEMS.map((row) => (
            <tr key={row}>
              {/* Column A: activity title */}
              <DataCell>
                <div className="display-flex flex-align-end">
                  <span className="text-bold text-no-wrap margin-right-2">
                    {row + 1}.
                  </span>
                  <div className="margin-top-05 padding-top-0">
                    <TextWidget
                      schema={activityTitleSchema}
                      id={`activity_line_items[${row}]--activity_title`}
                      rawErrors={getErrorsA({
                        errors,
                        id: `activity_line_items[${row}]--activity_title`,
                      })}
                      formClassName="margin-left-2"
                      inputClassName="minw-10"
                      value={getItemVal(row, "activity_title")}
                    />
                  </div>
                </div>
              </DataCell>

              {/* Column B: assistance listing */}
              <DataCell>
                <div className="display-flex flex-align-end">
                  <div className="margin-top-05 padding-top-0">
                    <TextWidget
                      schema={assistanceListingNumberSchema}
                      id={`activity_line_items[${row}]--assistance_listing_number`}
                      rawErrors={getErrorsA({
                        errors,
                        id: `activity_line_items[${row}]--assistance_listing_number`,
                      })}
                      inputClassName="minw-10"
                      value={getItemVal(row, "assistance_listing_number")}
                    />
                  </div>
                </div>
              </DataCell>

              {/* Column C: federal estimated unobligated */}
              <DataCell>
                <div className="display-flex flex-align-end">
                  <div className="margin-top-3 padding-top-0">
                    <CurrencyInput
                      id={`activity_line_items[${row}]--budget_summary--federal_estimated_unobligated_amount`}
                      rawErrors={getErrorsA({
                        errors,
                        id: `activity_line_items[${row}]--budget_summary--federal_estimated_unobligated_amount`,
                      })}
                      value={getBudgetVal(
                        row,
                        "federal_estimated_unobligated_amount",
                      )}
                    />
                  </div>
                </div>
              </DataCell>

              {/* Column D: non-federal estimated unobligated */}
              <DataCell>
                <div className="display-flex flex-align-end">
                  <div className="margin-top-3 padding-top-0">
                    <CurrencyInput
                      id={`activity_line_items[${row}]--budget_summary--non_federal_estimated_unobligated_amount`}
                      rawErrors={getErrorsA({
                        errors,
                        id: `activity_line_items[${row}]--budget_summary--non_federal_estimated_unobligated_amount`,
                      })}
                      value={getBudgetVal(
                        row,
                        "non_federal_estimated_unobligated_amount",
                      )}
                    />
                  </div>
                </div>
              </DataCell>

              {/* Column E: federal new/revised */}
              <DataCell>
                <div className="display-flex flex-align-end">
                  <div className="margin-top-3 padding-top-0">
                    <CurrencyInput
                      id={`activity_line_items[${row}]--budget_summary--federal_new_or_revised_amount`}
                      rawErrors={getErrorsA({
                        errors,
                        id: `activity_line_items[${row}]--budget_summary--federal_new_or_revised_amount`,
                      })}
                      value={getBudgetVal(row, "federal_new_or_revised_amount")}
                    />
                  </div>
                </div>
              </DataCell>

              {/* Column F: non-federal new/revised */}
              <DataCell>
                <div className="display-flex flex-align-end">
                  <div className="margin-top-3 padding-top-0">
                    <CurrencyInput
                      id={`activity_line_items[${row}]--budget_summary--non_federal_new_or_revised_amount`}
                      rawErrors={getErrorsA({
                        errors,
                        id: `activity_line_items[${row}]--budget_summary--non_federal_new_or_revised_amount`,
                      })}
                      value={getBudgetVal(
                        row,
                        "non_federal_new_or_revised_amount",
                      )}
                    />
                  </div>
                </div>
              </DataCell>

              {/* Column G: total */}
              <DataCell>
                <div className="display-flex flex-align-end">
                  <span className="margin-right-1">=</span>
                  <div>
                    <div className="text-normal text-no-wrap text-italic font-sans-2xs">
                      Sum of row {row + 1}
                    </div>
                    <CurrencyInput
                      id={`activity_line_items[${row}]--budget_summary--total_amount`}
                      rawErrors={getErrorsA({
                        errors,
                        id: `activity_line_items[${row}]--budget_summary--total_amount`,
                      })}
                      value={getBudgetVal(row, "total_amount")}
                    />
                  </div>
                </div>
              </DataCell>
            </tr>
          ))}

          {/* Totals row */}
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
              <HelperText hasHorizontalLine>Sum of column C</HelperText>
              <CurrencyInput
                id={
                  "total_budget_summary--federal_estimated_unobligated_amount"
                }
                rawErrors={getErrorsA({
                  errors,
                  id: "total_budget_summary--federal_estimated_unobligated_amount",
                })}
                value={totals?.federal_estimated_unobligated_amount}
                bordered
              />
            </td>

            <td className="padding-05">
              <HelperText hasHorizontalLine>Sum of column D</HelperText>
              <CurrencyInput
                id={
                  "total_budget_summary--non_federal_estimated_unobligated_amount"
                }
                rawErrors={getErrorsA({
                  errors,
                  id: "total_budget_summary--non_federal_estimated_unobligated_amount",
                })}
                value={totals?.non_federal_estimated_unobligated_amount}
                bordered
              />
            </td>

            <td className="padding-05">
              <HelperText hasHorizontalLine>Sum of column E</HelperText>
              <CurrencyInput
                id={"total_budget_summary--federal_new_or_revised_amount"}
                rawErrors={getErrorsA({
                  errors,
                  id: "total_budget_summary--federal_new_or_revised_amount",
                })}
                value={totals?.federal_new_or_revised_amount}
                bordered
              />
            </td>

            <td className="padding-05">
              <HelperText hasHorizontalLine>Sum of column F</HelperText>
              <CurrencyInput
                id={"total_budget_summary--non_federal_new_or_revised_amount"}
                rawErrors={getErrorsA({
                  errors,
                  id: "total_budget_summary--non_federal_new_or_revised_amount",
                })}
                value={totals?.non_federal_new_or_revised_amount}
                bordered
              />
            </td>

            <td className="padding-05">
              <HelperText hasHorizontalLine>Sum of column G</HelperText>
              <CurrencyInput
                id={"total_budget_summary--total_amount"}
                rawErrors={getErrorsA({
                  errors,
                  id: "total_budget_summary--total_amount",
                })}
                value={totals?.total_amount}
                bordered
              />
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default Budget424aSectionA;
