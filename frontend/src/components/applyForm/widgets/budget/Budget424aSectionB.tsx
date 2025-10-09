/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { get } from "lodash";

import React, { JSX } from "react";
import { Table } from "@trussworks/react-uswds";

import {
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import { BUDGET_ACTIVITY_COLUMNS } from "./budgetConstants";
import { BaseActivityItem, MoneyString } from "./budgetTypes";
import {
  ColumnHelperText,
  CurrencyInput,
  HelperText,
} from "./budgetUiComponents";

interface BudgetCategories {
  personnel_amount?: MoneyString;
  fringe_benefits_amount?: MoneyString;
  travel_amount?: MoneyString;
  equipment_amount?: MoneyString;
  supplies_amount?: MoneyString;
  contractual_amount?: MoneyString;
  construction_amount?: MoneyString;
  other_amount?: MoneyString;
  total_direct_charge_amount?: MoneyString;
  total_indirect_charge_amount?: MoneyString;
  total_amount?: MoneyString;
  program_income_amount?: MoneyString;
}

interface ActivityItem extends BaseActivityItem {
  budget_categories?: BudgetCategories;
  budget_summary?: { total_amount?: MoneyString };
}

type FieldKey = keyof BudgetCategories;

const getAsStringOrUndefined = (
  source: unknown,
  path: string,
): string | undefined => {
  const candidate = get(source as object, path);
  return typeof candidate === "string" ? candidate : undefined;
};

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
  const COLUMNS = BUDGET_ACTIVITY_COLUMNS;

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
  // row i
  const ROW_I_KEY: FieldKey = "total_direct_charge_amount";
  // row k
  const ROW_K_KEY: FieldKey = "total_amount";

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
    if (rowKey === ROW_I_KEY)
      return <ColHelper columnNumber={5} hasHorizontalLine />;
    if (rowKey === ROW_K_KEY)
      return <HelperText hasHorizontalLine>Sum of i and j</HelperText>;
    return <RowHelper letter={letter} />;
  };

  type RowDef = { key: FieldKey; label: string; letter: string; note?: string };

  const rows: RowDef[] = [
    { key: "personnel_amount", label: "a. Personnel", letter: "a" },
    { key: "fringe_benefits_amount", label: "b. Fringe benefits", letter: "b" },
    { key: "travel_amount", label: "c. Travel", letter: "c" },
    { key: "equipment_amount", label: "d. Equipment", letter: "d" },
    { key: "supplies_amount", label: "e. Supplies", letter: "e" },
    { key: "contractual_amount", label: "f. Contractual", letter: "f" },
    { key: "construction_amount", label: "g. Construction", letter: "g" },
    { key: "other_amount", label: "h. Other", letter: "h" },
    {
      key: "total_direct_charge_amount",
      label: "i. Total direct charges",
      letter: "i",
      note: "Sum of rows a-h",
    },
    {
      key: "total_indirect_charge_amount",
      label: "j. Total indirect charges",
      letter: "j",
    },
    {
      key: "total_amount",
      label: "k. TOTAL (i + j)",
      letter: "k",
      note: "Direct + Indirect",
    },
  ];

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
  }: {
    fieldKey: FieldKey;
    index: number;
  }): JSX.Element => {
    const idPath = `activity_line_items[${index}]--budget_categories--${fieldKey}`;
    return (
      <CurrencyInput
        id={idPath}
        rawErrors={getErrors({ errors, id: idPath })}
        value={activityItems?.[index]?.budget_categories?.[fieldKey]}
      />
    );
  };

  // Category total (rightmost column)
  const totalInput = ({ fieldKey }: { fieldKey: FieldKey }): JSX.Element => {
    const idPath = `total_budget_categories--${fieldKey}`;
    return (
      <CurrencyInput
        id={idPath}
        rawErrors={getErrors({ errors, id: idPath })}
        value={totals?.[fieldKey]}
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
              colSpan={2}
              rowSpan={2}
              className="bg-base-lightest text-bold border-base-light border-x-1px verticle-align-bottom"
            >
              Category total
              <div className="font-sans-2xs text-italic">(sum of 1 - 4)</div>
            </th>
          </tr>

          <tr className="bg-base-lighter">
            {/* columns 1-4 */}
            {COLUMNS.map((index) => {
              const title = getAsStringOrUndefined(
                activityItems,
                `[${index}].activity_title`,
              );
              const cfda = getAsStringOrUndefined(
                activityItems,
                `[${index}].assistance_listing_number`,
              );

              return (
                <th
                  key={`col-${index}`}
                  className="bg-base-lightest text-center border-base-light border-x-1px"
                  scope="col"
                >
                  <div className="text-center">
                    <div className="text-bold">{index + 1}</div>
                    <div className="font-sans-xs text-italic">
                      {title?.trim() || "—"}
                    </div>
                    {cfda ? (
                      <div className="font-sans-3xs text-base-dark text-italic">
                        CFDA: {cfda}
                      </div>
                    ) : null}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {/* 6. Object class categories */}
          <tr className="bg-base-lightest">
            <th
              scope="row"
              className="padding-05 text-bold border-bottom-0 verticle-align-bottom"
            >
              6. Object class categories
            </th>

            {COLUMNS.map((columnIndex) => {
              const title = getAsStringOrUndefined(
                activityItems,
                `[${columnIndex}].activity_title`,
              );

              return (
                <td
                  key={`occ-title-${columnIndex}`}
                  className="padding-05 border-bottom-0 border-top-0 verticle-align-bottom"
                >
                  {/* display-only title with fallback dash */}
                  <div className="minw-15 font-sans-sm text-italic">
                    {title && title.trim() !== "" ? title : "—"}
                  </div>
                </td>
              );
            })}

            <td colSpan={2} className="border-bottom-0 border-top-0" />
          </tr>

          {rows.map((row) => (
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

              {/* Four activity columns */}
              {COLUMNS.map((columnIndex) => {
                const extraPad =
                  row.key !== ROW_I_KEY && row.key !== ROW_K_KEY
                    ? " padding-top-5"
                    : "";
                const showLine = row.key === ROW_I_KEY || row.key === ROW_K_KEY;

                return (
                  <td
                    key={`cell-${row.key}-${columnIndex}`}
                    className={`border-bottom-0 border-top-0 padding-05 verticle-align-top sf424a__cell ${extraPad}`}
                    height={"inherit"}
                  >
                    <div className="display-flex flex-column ">
                      {row.key === ROW_I_KEY && (
                        <ColHelper
                          columnNumber={columnIndex + 1}
                          hasHorizontalLine={showLine}
                        />
                      )}
                      {row.key === ROW_K_KEY && (
                        <HelperText hasHorizontalLine={showLine}>
                          Sum of i and j
                        </HelperText>
                      )}
                      <div className="margin-top-auto">
                        {cellInput({ fieldKey: row.key, index: columnIndex })}
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
                {totalInput({ fieldKey: row.key })}
              </td>
            </tr>
          ))}
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
            {COLUMNS.map((columnIndex) => (
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
            <td
              className="border-bottom-0 border-top-0 verticle-align-bottom"
              aria-hidden="true"
            >
              <div className="display-flex flex-column">=</div>
            </td>
            <td className="padding-05 padding-left-2 verticle-align-bottom">
              <HelperText hasHorizontalLine={false}>Sum of row 7</HelperText>
              {totalInput({ fieldKey: "program_income_amount" })}
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default Budget424aSectionB;
