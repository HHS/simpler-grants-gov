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

interface NonFederalResources {
  applicant_amount?: MoneyString;
  state_amount?: MoneyString;
  other_amount?: MoneyString;
  total_amount?: MoneyString;
}
type AmountKey = keyof NonFederalResources;

interface ActivityItem {
  activity_title?: string;
  non_federal_resources?: NonFederalResources;
  [k: string]: unknown;
}
type ActivityItems = ActivityItem[];

function Budget424aSectionC<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  value: rawValue = [],
  rawErrors,
}: UswdsWidgetProps<T, S, F>): JSX.Element {
  const errors = (rawErrors as FormValidationWarning[]) || [];

  const activityItemUnknown = Array.isArray(rawValue)
    ? (rawValue as unknown)
    : (get(rawValue as object, "activity_line_items") as unknown);
  const activityItems: ActivityItems = Array.isArray(activityItemUnknown)
    ? (activityItemUnknown as ActivityItems)
    : [];

  const totalsUnknown = Array.isArray(rawValue)
    ? undefined
    : (get(rawValue as object, "total_non_federal_resources") as unknown);
  const totals: NonFederalResources | undefined =
    typeof totalsUnknown === "object" && totalsUnknown !== null
      ? (totalsUnknown as NonFederalResources)
      : undefined;

  // Exactly 4 activities (rows 1-4), then a 5th total row
  const ROWS = [0, 1, 2, 3] as const;

  // currency-like inputs
  const amountSchema = {
    type: "string" as const,
    pattern: "^\\d*([.]\\d{2})?$",
    maxLength: 14,
  };

  // simple title constraints
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

  // per-activity inputs (row 1-4)
  // starting at 8
  const rowNumbering = (rowIndex: number): JSX.Element => (
    <span className="text-bold text-no-wrap margin-right-1">
      {rowIndex + 8}.
    </span>
  );

  const titleInput = (rowIndex: number): JSX.Element => {
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

  const cellInput = (rowIndex: number, fieldKey: AmountKey): JSX.Element => {
    const idPath = `activity_line_items[${rowIndex}]--non_federal_resources--${fieldKey}`;
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
          `[${rowIndex}].non_federal_resources.${fieldKey}`,
        )}
      />
    );
  };

  // total row inputs (row 5)
  const totalInput = (fieldKey: AmountKey): JSX.Element => {
    const idPath = `total_non_federal_resources--${fieldKey}`;
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

  return (
    <div key={id} id={id}>
      <Table
        bordered={false}
        className="usa-table--borderless simpler-responsive-table width-full border-1px border-base-light table-layout-auto"
      >
        <thead>
          <tr className="bg-base-lighter">
            <th
              className="bg-base-lightest text-bold border-left-0 border-right-0 border-x-1px border-base-light"
              rowSpan={2}
            >
              &nbsp;
            </th>
            <th
              scope="col"
              className="bg-base-lightest text-bold border-bottom-0 width-card border-base-light"
            >
              Grant program
            </th>
            <th
              scope="col"
              className="bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light"
            >
              Applicant
            </th>
            <th
              scope="col"
              className="bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light"
            >
              State
            </th>
            <th
              scope="col"
              className="bg-base-lightest text-bold border-bottom-0 border-right-0 border-x-1px text-center border-base-light"
            >
              Other sources
            </th>
            <th
              className="bg-base-lightest text-bold border-left-0 border-right-0 border-x-1px border-base-light"
              rowSpan={2}
            >
              &nbsp;
            </th>
            <th
              scope="col"
              className="bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light"
            >
              Total
            </th>
          </tr>
          <tr className="bg-base-lighter">
            <th
              scope="col"
              className="bg-base-lightest text-bold border-top-0 border-left-0 border-x-1px text-center border-base-light"
            >
              A
            </th>
            <th className="bg-base-lightest text-bold border-top-0 border-x-1px text-center border-base-light">
              B
            </th>
            <th className="bg-base-lightest text-bold border-top-0 border-x-1px text-center border-base-light">
              C
            </th>
            <th className="bg-base-lightest text-bold border-right-0 border-x-1px text-center border-base-light">
              D
            </th>
            <th className="bg-base-lightest text-bold border-top-0 border-x-1px text-center border-base-light">
              E
            </th>
          </tr>
        </thead>

        <tbody>
          {/* Rows 1-4: one per activity */}
          {ROWS.map((rowIndex) => (
            <tr key={`row-${rowIndex}`} className="sf424a__row">
              <th
                scope="row"
                className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom"
              >
                {rowNumbering(rowIndex)}
              </th>

              {/* Column A: activity title */}
              <th
                scope="row"
                className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom"
              >
                {titleInput(rowIndex)}
              </th>

              {/* Columns B-D: Applicant, State, Other */}
              <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom">
                <div className="display-flex flex-column sf424a__cell-content">
                  {cellInput(rowIndex, "applicant_amount")}
                </div>
              </td>
              <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom">
                <div className="display-flex flex-column sf424a__cell-content">
                  {cellInput(rowIndex, "state_amount")}
                </div>
              </td>
              <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom">
                <div className="display-flex flex-column sf424a__cell-content">
                  {cellInput(rowIndex, "other_amount")}
                </div>
              </td>

              {/* visual equals column */}
              <td
                className="border-bottom-0 border-top-0 verticle-align-bottom"
                aria-hidden="true"
              >
                =
              </td>

              {/* Column E: Total — with helper */}
              <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom">
                <div className="display-flex flex-column sf424a__cell-content">
                  <HelperText>Sum of row {rowIndex + 8}</HelperText>
                  {cellInput(rowIndex, "total_amount")}
                </div>
              </td>
            </tr>
          ))}

          {/* Row 5 (12): TOTAL */}
          <tr className="bg-base-lightest sf424a__row">
            <th
              scope="row"
              className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom"
            >
              <span>12.</span>
            </th>
            <th
              scope="row"
              className="padding-05 border-bottom-0 border-top-0 sf424a__cell sf424a__cell--row-headers"
            >
              <div className="display-flex flex-column sf424a__cell-content">
                <div className="margin-top-auto">
                  Total
                  <div className="font-sans-3xs text-italic">
                    (sum of rows 8-11)
                  </div>
                </div>
              </div>
            </th>
            <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell">
              <HelperText>Sum of column B</HelperText>
              {totalInput("applicant_amount")}
            </td>
            <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell">
              <HelperText>Sum of column C</HelperText>
              {totalInput("state_amount")}
            </td>
            <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell">
              <HelperText>Sum of column D</HelperText>
              {totalInput("other_amount")}
            </td>
            <td
              aria-hidden="true"
              className="padding-05 border-bottom-0 border-top-0"
            >
              &nbsp;
            </td>
            <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell">
              <HelperText>Sum of row 12</HelperText>
              {totalInput("total_amount")}
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default Budget424aSectionC;
