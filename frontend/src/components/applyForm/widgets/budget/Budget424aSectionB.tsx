/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { get } from "lodash";

import React, { JSX } from "react";
import { Table } from "@trussworks/react-uswds";

import {
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import {
  ACTIVITY_ITEMS,
  SECTION_B_ROW_I_KEY,
  SECTION_B_ROW_K_KEY,
  SECTION_B_ROWS,
} from "./budgetConstants";
import { ActivityItem, BudgetCategories, FieldKey } from "./budgetTypes";
import {
  ActivityTitlesRow,
  ColumnHelperText,
  CurrencyInput,
  EqualsSpacer,
  HelperText,
} from "./budgetUiComponents";

function Budget424aSectionB<
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

  // Normalize incoming value:
  // multiField passes an object with activity_line_items + total_budget_categories
  const activityItemsUnknown = Array.isArray(rawValue)
    ? (rawValue as unknown)
    : (get(rawValue as object, "activity_line_items") as unknown);

  const activityItems: ActivityItem[] = Array.isArray(activityItemsUnknown)
    ? (activityItemsUnknown as ActivityItem[])
    : [];

  const totalsUnknown = Array.isArray(rawValue)
    ? undefined
    : (get(rawValue as object, "total_budget_categories") as unknown);

  const totals: BudgetCategories | undefined =
    typeof totalsUnknown === "object" && totalsUnknown !== null
      ? (totalsUnknown as BudgetCategories)
      : undefined;

  // Section B rows (A-K)

  const ColHelper: React.FC<{
    columnNumber: number;
    hasHorizontalLine?: boolean;
  }> = ({ columnNumber, hasHorizontalLine }) => (
    <ColumnHelperText
      columnNumber={columnNumber}
      hasHorizontalLine={hasHorizontalLine}
    />
  );

  const RowHelper: React.FC<{ letter: string }> = ({ letter }): JSX.Element => (
    <HelperText>{`Sum of row ${letter}`}</HelperText>
  );

  // Column 5 helper (Category total)
  const TotalColHelper: React.FC<{ rowKey: FieldKey; letter: string }> = ({
    rowKey,
    letter,
  }) => {
    if (rowKey === SECTION_B_ROW_I_KEY)
      return <ColHelper columnNumber={5} hasHorizontalLine />;
    if (rowKey === SECTION_B_ROW_K_KEY)
      return <HelperText hasHorizontalLine>Sum of i and j</HelperText>;
    return <RowHelper letter={letter} />;
  };

  const getErrors = ({
    errors,
    id,
  }: {
    id: string;
    errors: FormValidationWarning[];
  }): string[] =>
    (errors || [])
      .filter((error) => error.field === id)
      .map((error) => error.message);

  const cellInput = ({
    fieldKey,
    index,
    disabled,
  }: {
    fieldKey: FieldKey;
    index: number;
    disabled?: boolean;
  }): JSX.Element => {
    const idPath = `activity_line_items[${index}]--budget_categories--${fieldKey}`;
    return (
      <CurrencyInput
        id={idPath}
        rawErrors={getErrors({ errors, id: idPath })}
        value={activityItems?.[index]?.budget_categories?.[fieldKey]}
        disabled={disabled}
      />
    );
  };

  // Category total (rightmost column)
  const totalInput = ({
    fieldKey,
    disabled = false,
  }: {
    fieldKey: FieldKey;
    disabled?: boolean;
  }): JSX.Element => {
    const idPath = `total_budget_categories--${fieldKey}`;
    return (
      <CurrencyInput
        id={idPath}
        rawErrors={getErrors({ errors, id: idPath })}
        value={totals?.[fieldKey]}
        disabled={disabled}
        bordered
      />
    );
  };

  return (
    <div key={id} id={id}>
      <Table
        bordered={false}
        className="sf424__table usa-table--borderless width-full border-1px border-base-light table-layout-auto"
      >
        <thead>
          <tr className="bg-base-lighter">
            <th
              scope="col"
              className="bg-base-lightest text-bold width-card border-base-light verticle-align-bottom"
              rowSpan={2}
            >
              &nbsp;
            </th>

            <th
              className="bg-base-lightest text-bold text-center border-base-light border-x-1px verticle-align-bottom"
              scope="colgroup"
              colSpan={4}
            >
              Grant program, function, or activity
            </th>

            <th
              scope="colgroup"
              colSpan={3}
              className="bg-base-lightest text-bold border-base-light border-x-1px verticle-align-bottom text-center"
            >
              Category total
              <div className="font-sans-2xs text-italic">(sum of 1 - 4)</div>
            </th>
          </tr>

          <tr className="bg-base-lighter">
            {/* first 4 columns */}
            {ACTIVITY_ITEMS.map((columnIndex: number) => (
              <th
                key={`col-${columnIndex}`}
                className="bg-base-lightest text-center border-base-light border-x-1px"
                scope="col"
              >
                <div className="text-center">
                  <div className="text-bold">{columnIndex + 1}</div>
                </div>
              </th>
            ))}

            {/* totals column (col 5) */}
            <th
              key="col-total"
              className="bg-base-lightest text-center border-base-light border-x-1px"
              scope="col"
              colSpan={3}
            >
              <div className="text-center">
                <div className="text-bold">5</div>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {/* 6. Object class categories (Activity Titles) */}
          <tr className="bg-base-lightest">
            <th
              scope="row"
              className="padding-05 text-bold border-bottom-0 verticle-align-bottom"
            >
              6. Object class categories
            </th>
            <ActivityTitlesRow
              activityItems={activityItems}
              columnIndices={ACTIVITY_ITEMS}
            />
            <td colSpan={2} className="border-bottom-0 border-top-0" />
          </tr>

          {SECTION_B_ROWS.map((row) => {
            const isRowI = row.key === SECTION_B_ROW_I_KEY;
            const isRowK = row.key === SECTION_B_ROW_K_KEY;
            const disableActivityCells = isRowI || isRowK;

            return (
              <tr key={row.key} className="sf424a__row">
                <th
                  scope="row"
                  className="padding-05 text-normal border-bottom-0 border-top-0 sf424a__cell sf424a__cell--row-headers"
                >
                  <div className="display-flex flex-column">
                    <span className="text-bold">{row.label}</span>
                    {row.note ? (
                      <span className="font-sans-3xs text-italic">
                        {row.note}
                      </span>
                    ) : null}
                  </div>
                </th>

                {/* Activity columns (1–4) */}
                {ACTIVITY_ITEMS.map((columnIndex: number) => {
                  const needsExtraPadding =
                    row.key !== SECTION_B_ROW_I_KEY &&
                    row.key !== SECTION_B_ROW_K_KEY;
                  const showHelperLine = isRowI || isRowK;

                  return (
                    <td
                      key={`cell-${row.key}-${columnIndex}`}
                      className={`border-bottom-0 border-top-0 padding-05 verticle-align-top sf424a__cell${
                        needsExtraPadding ? " padding-top-5" : ""
                      }`}
                    >
                      <div className="display-flex flex-column">
                        {isRowI && (
                          <ColHelper
                            columnNumber={columnIndex + 1}
                            hasHorizontalLine={showHelperLine}
                          />
                        )}
                        {isRowK && (
                          <HelperText hasHorizontalLine={showHelperLine}>
                            Sum of i and j
                          </HelperText>
                        )}
                        <div className="margin-top-auto">
                          {cellInput({
                            fieldKey: row.key,
                            index: columnIndex,
                            disabled: disableActivityCells,
                          })}
                        </div>
                      </div>
                    </td>
                  );
                })}

                <td className="border-bottom-0 border-top-0 verticle-align-bottom">
                  <div className="display-flex flex-column">=</div>
                </td>

                {/* TOTAL (Column 5) */}
                <td className="border-bottom-0 border-top-0 padding-05 margin-top-auto">
                  <TotalColHelper rowKey={row.key} letter={row.letter} />
                  {totalInput({ fieldKey: row.key, disabled: true })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Table className="sf424__table usa-table--borderless width-full border-1px border-base-light table-layout-auto">
        <tbody>
          {/* Program income — total column only (Line 7) */}
          <tr className="bg-base-lightest">
            <th
              scope="row"
              className="padding-05 padding-right-8 verticle-align-bottom"
            >
              7. Program income
            </th>
            {ACTIVITY_ITEMS.map((columnIndex) => (
              <td
                key={`pi-${columnIndex}`}
                className="padding-05 verticle-align-bottom"
              >
                {cellInput({
                  fieldKey: "program_income_amount",
                  index: columnIndex,
                })}
              </td>
            ))}
            <EqualsSpacer />
            <td className="padding-05 padding-left-2 verticle-align-bottom">
              <HelperText hasHorizontalLine={false}>Sum of row 7</HelperText>
              {totalInput({
                fieldKey: "program_income_amount",
                disabled: true,
              })}
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default Budget424aSectionB;
