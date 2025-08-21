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

interface FederalFundEstimates {
  first_year_amount?: MoneyString;
  second_year_amount?: MoneyString;
  third_year_amount?: MoneyString;
  fourth_year_amount?: MoneyString;
}

interface ActivityItem {
  activity_title?: string;
  assistance_listing_number?: string;
  federal_fund_estimates?: FederalFundEstimates;
  [k: string]: unknown;
}

type ActivityItems = ActivityItem[];

type TotalFederalFundEstimates = FederalFundEstimates | undefined;

function Budget424aSectionE<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  value: rawValue = [],
  rawErrors,
}: UswdsWidgetProps<T, S, F>): JSX.Element {
  const errors = (rawErrors as FormValidationWarning[]) || [];

  const aiUnknown = get(rawValue as object, "activity_line_items") as unknown;
  const activityItems: ActivityItems = Array.isArray(rawValue)
    ? (rawValue as unknown as ActivityItems)
    : Array.isArray(aiUnknown)
      ? (aiUnknown as ActivityItems)
      : [];

  const totalsUnknown = get(
    rawValue as object,
    "total_federal_fund_estimates",
  ) as unknown;
  const totals: TotalFederalFundEstimates = Array.isArray(rawValue)
    ? undefined
    : typeof totalsUnknown === "object" && totalsUnknown !== null
      ? (totalsUnknown as FederalFundEstimates)
      : undefined;

  // 4 programs (rows 1-4) and 4 years (columns B-E)
  const ROWS = [0, 1, 2, 3] as const;
  const YEARS = [
    { key: "first_year_amount", short: "First year", colLabel: "B" },
    { key: "second_year_amount", short: "Second year", colLabel: "C" },
    { key: "third_year_amount", short: "Third year", colLabel: "D" },
    { key: "fourth_year_amount", short: "Fourth year", colLabel: "E" },
  ] as const;
  type YearKey = (typeof YEARS)[number]["key"];

  const amountSchema = {
    type: "string" as const,
    pattern: "^\\d*([.]\\d{2})?$",
    maxLength: 14,
  };

  const titleSchema = {
    type: "string" as const,
    minLength: 0,
    maxLength: 120,
  };

  const getErrors = ({
    errors,
    id,
  }: {
    id: string;
    errors: FormValidationWarning[];
  }): string[] =>
    (errors || []).filter((e) => e.field === id).map((e) => e.message);

  const HelperText: React.FC<React.PropsWithChildren> = ({ children }) => (
    <div className="text-italic font-sans-2xs border-top-2px width-full padding-top-2 margin-top-1">
      {children}
    </div>
  );

  // Grant program title cell (leftmost column)
  const rowTitleInput = (rowIndex: number): JSX.Element => {
    const idPath = `activity_line_items[${rowIndex}]--activity_title`;
    return (
      <div className="display-flex flex-align-end">
        <TextWidget
          schema={titleSchema}
          id={idPath}
          rawErrors={getErrors({ errors, id: idPath })}
          formClassName="margin-top-1"
          inputClassName="minw-15"
          value={get(activityItems, `[${rowIndex}].activity_title`)}
        />
      </div>
    );
  };

  // Per-program, per-year cell
  const cellInput = (rowIndex: number, yearKey: YearKey): JSX.Element => {
    const idPath = `activity_line_items[${rowIndex}]--federal_fund_estimates--${yearKey}`;
    return (
      <TextWidget
        schema={amountSchema}
        id={idPath}
        rawErrors={getErrors({ errors, id: idPath })}
        formClassName="margin-top-auto padding-top-05 simpler-currency-input-wrapper"
        inputClassName="minw-10"
        inputMode="decimal"
        pattern="\\d*(\\.\\d{2})?"
        maxLength={14}
        value={get(
          activityItems,
          `[${rowIndex}].federal_fund_estimates.${yearKey}`,
        )}
      />
    );
  };

  // Bottom totals row (sums across programs for each year)
  const totalInput = (yearKey: YearKey, helper: string): JSX.Element => {
    const idPath = `total_federal_fund_estimates--${yearKey}`;
    return (
      <div className="display-flex flex-column">
        <HelperText>{helper}</HelperText>
        <TextWidget
          schema={amountSchema}
          id={idPath}
          rawErrors={getErrors({ errors, id: idPath })}
          formClassName="margin-top-1 padding-top-05 simpler-currency-input-wrapper"
          inputClassName="minw-10 border-2px"
          inputMode="decimal"
          pattern="\\d*(\\.\\d{2})?"
          maxLength={14}
          value={totals ? totals[yearKey] : undefined}
        />
      </div>
    );
  };

  // Helper text mapping for totals row
  const totalHelpersByYear: Record<YearKey, string> = {
    first_year_amount: "Sum of column B",
    second_year_amount: "Sum of column C",
    third_year_amount: "Sum of column D",
    fourth_year_amount: "Sum of column E",
  };

  return (
    <div key={id} id={id}>
      <p>
        Enter the estimated federal funds that will be required in the first,
        second, third, and fourth funding years for each program.
      </p>

      <Table
        bordered={false}
        className="usa-table--borderless simpler-responsive-table width-full border-1px border-base-light table-layout-auto"
      >
        <thead>
          <tr>
            <th
              colSpan={2}
              className="bg-base-lightest text-bold border-x-1px  border-bottom-0 border-base-light"
            >
              &nbsp;
            </th>
            <th
              scope="col"
              colSpan={4}
              className="bg-base-lightest text-bold text-center width-card border-base-light text-align-center"
            >
              Future funding periods
            </th>
          </tr>
          <tr className="bg-base-lighter">
            <th className="bg-base-lightest border-bottom-0 border-base-light">
              &nbsp;
            </th>
            <th
              scope="col"
              className="bg-base-lightest text-bold border-bottom-0 width-card border-base-light text-center"
            >
              Grant Programs
            </th>
            {YEARS.map((y) => (
              <th
                key={y.key}
                scope="col"
                className="bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light"
              >
                {y.short}
              </th>
            ))}
          </tr>
          <tr className="bg-base-lighter">
            <th className="bg-base-lightest  border-top-0 border-left-0 border-right-0 border-x-1px border-base-light">
              &nbsp;
            </th>
            <th
              scope="col"
              className="bg-base-lightest text-bold border-top-0 border-left-0 border-x-1px text-center border-base-light"
            >
              A
            </th>
            {YEARS.map((y) => (
              <th
                key={`col-${y.colLabel}`}
                className="bg-base-lightest text-bold border-top-0 border-x-1px text-center border-base-light"
              >
                {y.colLabel}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* Rows 1-4: one per grant program */}
          {ROWS.map((rowIndex) => (
            <tr key={`row-${rowIndex}`} className="sf424a__row">
              <td className="border-bottom-0 border-top-0 verticle-align-bottom">
                {rowIndex + 16}.
              </td>
              {/* Column A: grant program input */}
              <th
                scope="row"
                className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom"
              >
                {rowTitleInput(rowIndex)}
              </th>

              {/* Columns B-E: First..Fourth year amounts for this program */}
              {YEARS.map((y) => (
                <td
                  key={`${rowIndex}-${y.key}`}
                  className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom"
                >
                  {cellInput(rowIndex, y.key)}
                </td>
              ))}
            </tr>
          ))}

          {/* Bottom totals row */}
          <tr className="bg-base-lightest sf424a__row">
            <th className="verticle-align-bottom">20.</th>
            <th
              scope="row"
              className="padding-05 border-bottom-0 border-top-0 sf424a__cell sf424a__cell--row-headers"
            >
              <div className="display-flex flex-column">
                <div className="margin-top-auto">Total</div>
                <span className="text-italic font-weight-100">
                  (sum of rows 16-19)
                </span>
              </div>
            </th>

            {YEARS.map((y) => (
              <td
                key={`total-${y.key}`}
                className="padding-05 border-bottom-0 border-top-0 sf424a__cell"
              >
                {totalInput(y.key, totalHelpersByYear[y.key])}
              </td>
            ))}
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default Budget424aSectionE;
