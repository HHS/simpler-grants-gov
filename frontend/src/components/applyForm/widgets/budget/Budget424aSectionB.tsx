/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { get } from "lodash";

import React, { JSX } from "react";
import { Table } from "@trussworks/react-uswds";

import {
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import TextWidget from "src/components/applyForm/widgets/TextWidget";

type MoneyString = string | undefined;

interface BudgetCategories {
  personnel_amount?: MoneyString; // a
  fringe_benefits_amount?: MoneyString; // b
  travel_amount?: MoneyString; // c
  equipment_amount?: MoneyString; // d
  supplies_amount?: MoneyString; // e
  contractual_amount?: MoneyString; // f
  construction_amount?: MoneyString; // g
  other_amount?: MoneyString; // h
  total_direct_charge_amount?: MoneyString; // i
  total_indirect_charge_amount?: MoneyString; // j
  total_amount?: MoneyString; // k
  program_income_amount?: MoneyString; // line 7
}
type FieldKey = keyof BudgetCategories;

interface ActivityItem {
  activity_title?: string;
  assistance_listing_number?: string;
  budget_categories?: BudgetCategories;
  [k: string]: unknown;
}
type ActivityItems = ActivityItem[];

function Budget424aSectionB<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  value: rawValue = [],
  rawErrors,
}: UswdsWidgetProps<T, S, F>): JSX.Element {
  const errors = (rawErrors as FormValidationWarning[]) || [];

  const activityItemsUnknown = Array.isArray(rawValue)
    ? (rawValue as unknown)
    : (get(rawValue as object, "activity_line_items") as unknown);
  const activityItems: ActivityItems = Array.isArray(activityItemsUnknown)
    ? (activityItemsUnknown as ActivityItems)
    : [];

  const totalsUnknown = Array.isArray(rawValue)
    ? undefined
    : (get(rawValue as object, "total_budget_categories") as unknown);
  const totals: BudgetCategories | undefined =
    typeof totalsUnknown === "object" && totalsUnknown !== null
      ? (totalsUnknown as BudgetCategories)
      : undefined;

  // Hardcode exactly 4 columns
  const COLUMNS = [0, 1, 2, 3] as const;

  // Mini schema for currency-like inputs
  const amountSchema = {
    type: "string" as const,
    pattern: "^\\d*([.]\\d{2})?$",
    maxLength: 14,
  };

  // Mini schema for plain text inputs
  const activityTitleSchema = {
    type: "string" as const,
    minLength: 0,
    maxLength: 120,
  };

  // Section B rows (A-K)
  const ROW_I_KEY: FieldKey = "total_direct_charge_amount"; // row i
  const ROW_K_KEY: FieldKey = "total_amount"; // row k

  interface HelperTextProps {
    hasHorizontalLine?: boolean;
  }

  const HelperText: React.FC<React.PropsWithChildren<HelperTextProps>> = ({
    hasHorizontalLine = true,
    children,
  }): JSX.Element => (
    <div
      className={`text-italic font-sans-2xs width-full margin-top-1 padding-top-1 ${hasHorizontalLine ? "border-top-2px" : ""}`}
    >
      {children}
    </div>
  );

  const ColHelper: React.FC<{ n: number }> = ({ n }): JSX.Element => (
    <HelperText>Sum of column {n}</HelperText>
  );
  const RowHelper: React.FC<{ letter: string }> = ({ letter }): JSX.Element => (
    <HelperText>{`Sum of row ${letter}.`}</HelperText>
  );

  // Column 5 helper (Category total)
  const TotalColHelper: React.FC<{ rowKey: FieldKey; letter: string }> = ({
    rowKey,
    letter,
  }): JSX.Element => {
    if (rowKey === ROW_I_KEY) return <ColHelper n={5} />;
    if (rowKey === ROW_K_KEY) return <HelperText>Sum of i and j</HelperText>;
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
      <TextWidget
        schema={amountSchema}
        id={idPath}
        rawErrors={getErrors({ errors, id: idPath })}
        formClassName="margin-top-1 padding-top-05 simpler-currency-input-wrapper"
        inputClassName="minw-10"
        inputMode="decimal"
        pattern="\\d*(\\.\\d{2})?"
        maxLength={14}
        value={get(activityItems, `[${index}].budget_categories.${fieldKey}`)}
      />
    );
  };

  const totalInput = ({ fieldKey }: { fieldKey: FieldKey }): JSX.Element => {
    const idPath = `total_budget_categories--${fieldKey}`;
    return (
      <TextWidget
        schema={amountSchema}
        id={idPath}
        rawErrors={getErrors({ errors, id: idPath })}
        formClassName="margin-top-1 simpler-currency-input-wrapper"
        inputClassName="minw-10 border-2px"
        inputMode="decimal"
        pattern="\\d*(\\.\\d{2})?"
        maxLength={14}
        value={totals ? totals[fieldKey] : undefined}
      />
    );
  };

  const colHeader = (index: number): JSX.Element => {
    const title = get(activityItems, `[${index}].activity_title`);
    const assistanceListingNumber = get(
      activityItems,
      `[${index}].assistance_listing_number`,
    );
    return (
      <div className="text-center">
        <div className="text-bold">{index + 1}</div>
        {title ? <div className="font-sans-xs text-italic">{title}</div> : null}
        {assistanceListingNumber ? (
          <div className="font-sans-3xs text-base-dark text-italic">
            CFDA: {assistanceListingNumber}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div key={id} id={id}>
      <Table
        bordered={false}
        className="usa-table--borderless simpler-responsive-table width-full border-1px border-base-light table-layout-auto"
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
            {COLUMNS.map((i) => (
              <th
                key={`col-${i}`}
                scope="col"
                className="bg-base-lightest text-bold border-x-1px text-center border-base-light verticle-align-bottom"
              >
                {colHeader(i)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr className="bg-base-lightest">
            <th
              scope="row"
              className="padding-05 text-bold border-bottom-0 verticle-align-bottom"
            >
              6. Object class categories
            </th>
            {COLUMNS.map((columnIndex) => (
              <td
                key={`occ-title-${columnIndex}`}
                className="padding-05 border-bottom-0 border-top-0 verticle-align-bottom"
              >
                <TextWidget
                  schema={activityTitleSchema}
                  id={`activity_line_items[${columnIndex}]--activity_title`}
                  rawErrors={getErrors({
                    errors,
                    id: `activity_line_items[${columnIndex}]--activity_title`,
                  })}
                  formClassName="margin-top-1"
                  inputClassName="minw-15"
                  value={get(activityItems, `[${columnIndex}].activity_title`)}
                />
              </td>
            ))}
            <td colSpan={2} className="border-bottom-0 border-top-0"></td>
          </tr>

          {rows.map((r) => (
            <tr key={r.key} className="sf424a__row">
              <th
                scope="row"
                className="padding-05 text-normal border-bottom-0 border-top-0 sf424a__cell sf424a__cell--row-headers"
              >
                <div className="display-flex flex-column">
                  <span className="text-bold">{r.label}</span>
                  {r.note ? (
                    <span className="font-sans-3xs text-italic">{r.note}</span>
                  ) : null}
                </div>
              </th>

              {/* Four activity columns */}
              {COLUMNS.map((columnIndex) => {
                const extraPad =
                  r.key !== ROW_I_KEY && r.key !== ROW_K_KEY
                    ? " padding-top-5"
                    : "";
                return (
                  <td
                    key={`cell-${r.key}-${columnIndex}`}
                    className={`border-bottom-0 border-top-0 padding-05 verticle-align-top sf424a__cell ${extraPad}`}
                    height={"inherit"}
                  >
                    <div className="display-flex flex-column ">
                      {r.key === ROW_I_KEY && <ColHelper n={columnIndex + 1} />}
                      {r.key === ROW_K_KEY && (
                        <HelperText>Sum of i and j</HelperText>
                      )}
                      <div className="margin-top-auto">
                        {cellInput({ fieldKey: r.key, index: columnIndex })}
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
                <TotalColHelper rowKey={r.key} letter={r.letter} />
                {totalInput({ fieldKey: r.key })}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Table className="usa-table--borderless simpler-responsive-table width-full border-1px border-base-light table-layout-auto">
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
