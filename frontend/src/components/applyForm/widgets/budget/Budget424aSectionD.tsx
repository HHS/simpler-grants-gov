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

interface ForecastedCashNeedsRow {
  first_quarter_amount?: MoneyString;
  second_quarter_amount?: MoneyString;
  third_quarter_amount?: MoneyString;
  fourth_quarter_amount?: MoneyString;
  total_amount?: MoneyString;
}

interface ForecastedCashNeeds {
  federal_forecasted_cash_needs?: ForecastedCashNeedsRow;
  non_federal_forecasted_cash_needs?: ForecastedCashNeedsRow;
  total_forecasted_cash_needs?: ForecastedCashNeedsRow;
}

type RowKey = keyof ForecastedCashNeeds;

function Budget424aSectionD<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  value: rawValue = {},
  rawErrors,
}: UswdsWidgetProps<T, S, F>): JSX.Element {
  const errors = (rawErrors as FormValidationWarning[]) || [];

  const candidate =
    get(rawValue as object, "forecasted_cash_needs") ?? rawValue;
  const root: ForecastedCashNeeds =
    typeof candidate === "object" && candidate !== null
      ? (candidate as ForecastedCashNeeds)
      : {};

  const amountSchema = {
    type: "string" as const,
    pattern: "^\\d*([.]\\d{2})?$",
    maxLength: 14,
  };

  const quarters = [
    { key: "first_quarter_amount", quarter: "1st Quarter", label: "A" },
    { key: "second_quarter_amount", quarter: "2nd Quarter", label: "B" },
    { key: "third_quarter_amount", quarter: "3rd Quarter", label: "C" },
    { key: "fourth_quarter_amount", quarter: "4th Quarter", label: "D" },
    {
      key: "total_amount",
      quarter: "Total for 1st year (sum of A-D)",
      label: "E",
    },
  ] as const;
  type ColKey = (typeof quarters)[number]["key"];

  const rows = [
    { key: "federal_forecasted_cash_needs", label: "13. Federal" },
    { key: "non_federal_forecasted_cash_needs", label: "14. Non-federal" },
    { key: "total_forecasted_cash_needs", label: "15. Total" },
  ] as const;

  // Helper text for the far-right "Total" on rows 13 & 14
  const rowTotalHelpers: Partial<Record<RowKey, string>> = {
    federal_forecasted_cash_needs: "Sum of row 13",
    non_federal_forecasted_cash_needs: "Sum of row 14",
  };

  // Helper text for the TOTAL row (row 15)
  const totalRowHelpers: Record<ColKey, string> = {
    first_quarter_amount: "Sum of column A",
    second_quarter_amount: "Sum of column B",
    third_quarter_amount: "Sum of column C",
    fourth_quarter_amount: "Sum of column D",
    total_amount: "Sum of column E",
  };

  const getErrors = ({
    errors,
    id,
  }: {
    id: string;
    errors: FormValidationWarning[];
  }): string[] =>
    (errors || []).filter((e) => e.field === id).map((e) => e.message);

  const HelperText: React.FC<
    React.PropsWithChildren<{ noBorder?: boolean }>
  > = ({ children, noBorder }) => (
    <div
      className={`text-italic font-sans-2xs width-full padding-top-2 margin-top-1${
        noBorder ? "" : " border-top-2px"
      }`}
    >
      {children}
    </div>
  );

  const cellInput = ({
    rowKey,
    colKey,
  }: {
    rowKey: RowKey;
    colKey: ColKey;
  }): JSX.Element => {
    const idPath = `forecasted_cash_needs--${rowKey}--${colKey}`;
    const rowObj = root[rowKey];
    const value = rowObj ? rowObj[colKey] : undefined;

    let helper: string | undefined;
    let isRowTotalHelper = false;

    if (rowKey in rowTotalHelpers && colKey === "total_amount") {
      helper = rowTotalHelpers[rowKey];
      isRowTotalHelper = true;
    } else if (rowKey === "total_forecasted_cash_needs") {
      helper = totalRowHelpers[colKey];
    }

    return (
      <div className="display-flex flex-column ">
        {helper && (
          <HelperText noBorder={isRowTotalHelper}>{helper}</HelperText>
        )}
        <TextWidget
          schema={amountSchema}
          id={idPath}
          rawErrors={getErrors({ errors, id: idPath })}
          formClassName={`margin-top-${helper ? "1" : "auto"} padding-top-05 simpler-currency-input-wrapper`}
          inputClassName="minw-10"
          inputMode="decimal"
          pattern="\\d*(\\.\\d{2})?"
          maxLength={14}
          value={value}
        />
      </div>
    );
  };

  return (
    <div key={id} id={id}>
      <p>
        Enter the forecasted cash needs from federal and non-federal sources for
        each quarter of the first program year.
      </p>

      <Table
        bordered={false}
        className="usa-table--borderless simpler-responsive-table width-full border-1px border-base-light table-layout-auto"
      >
        <thead>
          <tr className="bg-base-lighter">
            <th
              scope="col"
              rowSpan={2}
              className="bg-base-lightest text-bold width-card border-base-light"
            >
              &nbsp;
            </th>
            {quarters.map((q, qIndex) => (
              <React.Fragment key={q.key}>
                <th
                  scope="col"
                  className={`bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light ${qIndex === 3 ? "border-right-0" : ""}`}
                >
                  {q.quarter}
                </th>

                {/* Empty header after column D */}
                {qIndex === 3 && (
                  <th
                    className="bg-base-lightest border-bottom-0 border-x-0 border-right-0 border-left-0 border-base-light"
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            ))}
          </tr>
          <tr>
            {quarters.map((q, qIndex) => (
              <React.Fragment key={q.key}>
                <th
                  scope="col"
                  className={`bg-base-lightest text-bold border-x-1px text-center border-base-light ${qIndex === 3 ? "border-right-0" : ""}`}
                >
                  {q.label}
                </th>

                {/* Empty header after column D */}
                {qIndex === 3 && (
                  <th
                    className="bg-base-lightest border-x-0 text-center border-right-0 border-left-0  border-base-light"
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r, rowIndex) => (
            <tr
              key={r.key}
              className={`sf424a__row${r.key === "total_forecasted_cash_needs" ? " bg-base-lightest" : ""}`}
            >
              <th
                scope="row"
                className="padding-05 border-top-0 border-bottom-0 text-bold sf424a__cell"
              >
                <div className="display-flex flex-column">
                  <div className="margin-top-auto padding-bottom-1">
                    {r.label}
                  </div>
                </div>
              </th>

              {quarters.map((q, qIndex) => (
                <React.Fragment key={`${r.key}-${q.key}`}>
                  <td className="padding-05 border-top-0 border-bottom-0 sf424a__cell verticle-align-bottom">
                    {cellInput({ rowKey: r.key as RowKey, colKey: q.key })}
                  </td>

                  {/* "=" for row 1 & 2, empty for row 3 (totals) */}
                  {qIndex === 3 && (
                    <td
                      className="border-bottom-0 border-top-0 verticle-align-bottom text-center text-bold"
                      aria-hidden="true"
                    >
                      {rowIndex < 2 ? "=" : ""}
                    </td>
                  )}
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default Budget424aSectionD;
