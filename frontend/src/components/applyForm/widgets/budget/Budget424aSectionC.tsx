/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { get } from "lodash";

import React, { JSX } from "react";
import { Table } from "@trussworks/react-uswds";

import {
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import { ACTIVITY_ITEMS } from "./budgetConstants";
import { getBudgetErrors } from "./budgetErrorLabels";
import { BaseActivityItem, MoneyString } from "./budgetTypes";
import { CurrencyInput, HelperText } from "./budgetUiComponents";
import { asMoney, getStringOrUndefined, isRecord } from "./budgetValueGuards";

interface NonFederalResources {
  applicant_amount?: MoneyString;
  state_amount?: MoneyString;
  other_amount?: MoneyString;
  total_amount?: MoneyString;
}

type AmountKey = keyof NonFederalResources;

interface ActivityItem extends BaseActivityItem {
  budget_summary?: {
    total_amount?: MoneyString;
  };
  non_federal_resources?: NonFederalResources;
}

type NormalizedC = {
  items: ActivityItem[];
  totals?: NonFederalResources;
};

function pickNonFederalResources(value: unknown): NonFederalResources {
  if (!isRecord(value)) return {};
  return {
    applicant_amount: asMoney(value.applicant_amount),
    state_amount: asMoney(value.state_amount),
    other_amount: asMoney(value.other_amount),
    total_amount: asMoney(value.total_amount),
  };
}

function pickActivityItem(value: unknown): ActivityItem {
  if (!isRecord(value)) return {};
  const activity: ActivityItem = {};
  if (typeof value.activity_title === "string")
    activity.activity_title = value.activity_title;
  if (typeof value.assistance_listing_number === "string") {
    activity.assistance_listing_number = value.assistance_listing_number;
  }
  if (isRecord(value.budget_summary)) {
    const total = asMoney(value.budget_summary.total_amount);
    activity.budget_summary = { total_amount: total };
  }
  if (isRecord(value.non_federal_resources)) {
    activity.non_federal_resources = pickNonFederalResources(
      value.non_federal_resources,
    );
  }
  return activity;
}

function normalizeSectionCValue(rawValue: unknown): NormalizedC {
  if (Array.isArray(rawValue)) {
    return { items: rawValue.map(pickActivityItem) };
  }

  if (isRecord(rawValue)) {
    const fromArray = rawValue.activity_line_items;
    const totalsObj = rawValue.total_non_federal_resources;
    if (Array.isArray(fromArray)) {
      return {
        items: fromArray.map(pickActivityItem),
        totals: pickNonFederalResources(totalsObj),
      };
    }

    const items: ActivityItem[] = [];
    for (const index of ACTIVITY_ITEMS) {
      items.push(pickActivityItem(rawValue[String(index)]));
    }

    let totals: NonFederalResources | undefined;
    if (isRecord(totalsObj)) {
      totals = pickNonFederalResources(totalsObj);
    } else {
      const rootTotals = pickNonFederalResources(rawValue);
      const hasAny =
        rootTotals.applicant_amount ||
        rootTotals.state_amount ||
        rootTotals.other_amount ||
        rootTotals.total_amount;
      totals = hasAny ? rootTotals : undefined;
    }

    return { items, totals };
  }

  return { items: [] };
}

function getHeaderCellClass(index: number, totalCount: number): string {
  const base =
    "bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light";

  // last item: remove border-base-light entirely
  if (index === totalCount - 1) {
    return "bg-base-lightest text-bold border-bottom-0 border-x-0 text-center";
  }
  return base;
}

function Budget424aSectionC<
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

  const { items: activityItems, totals } = normalizeSectionCValue(rawValue);

  function getErrorMessagesForField(fieldId: string): string[] {
    return getBudgetErrors({ errors, id: fieldId, section: "C" });
  }

  // column labels for the money fields
  const fields: { key: AmountKey; label: string }[] = [
    { key: "applicant_amount", label: "Applicant" },
    { key: "state_amount", label: "State" },
    { key: "other_amount", label: "Other sources" },
  ];

  const titleCell = (rowIndex: number): JSX.Element => {
    const title =
      getStringOrUndefined(activityItems, `[${rowIndex}].activity_title`) ?? "";
    const cfda =
      getStringOrUndefined(
        activityItems,
        `[${rowIndex}].assistance_listing_number`,
      ) ?? "";

    return (
      <div className="display-flex flex-column">
        {/* Display text only (no input). Fallback to dash. */}
        <div className="minw-15 font-sans-sm text-italic">
          {title.trim() ? title : "—"}
        </div>
        {cfda.trim() ? (
          <div className="font-sans-3xs text-base-dark text-italic">
            CFDA: {cfda}
          </div>
        ) : null}
      </div>
    );
  };

  const cellInput = (rowIndex: number, fieldKey: AmountKey): JSX.Element => {
    const idPath = `activity_line_items[${rowIndex}]--non_federal_resources--${fieldKey}`;
    return (
      <CurrencyInput
        id={idPath}
        rawErrors={getErrorMessagesForField(idPath)}
        value={get(
          activityItems,
          `[${rowIndex}].non_federal_resources.${fieldKey}`,
        )}
      />
    );
  };

  const rowTotalInput = (rowIndex: number): JSX.Element => {
    const idPath = `activity_line_items[${rowIndex}]--non_federal_resources--total_amount`;
    return (
      <div className="display-flex flex-column">
        <HelperText>Sum of row {rowIndex + 8}</HelperText>
        <CurrencyInput
          disabled
          id={idPath}
          value={get(
            activityItems,
            `[${rowIndex}].non_federal_resources.total_amount`,
          )}
        />
      </div>
    );
  };

  const totalInput = (fieldKey: AmountKey): JSX.Element => {
    const idPath = `total_non_federal_resources--${fieldKey}`;
    return (
      <div className="display-flex flex-column">
        {/* Helper only for subtotal row */}
        <HelperText hasHorizontalLine>
          {fieldKey === "total_amount"
            ? "Sum of row 12"
            : `Sum of column ${fieldKey === "applicant_amount" ? "B" : fieldKey === "state_amount" ? "C" : "D"}`}
        </HelperText>
        <CurrencyInput
          disabled
          id={idPath}
          value={totals ? totals[fieldKey] : undefined}
          bordered
        />
      </div>
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
            {fields.map((field, index) => (
              <th
                key={field.key}
                scope="col"
                className={getHeaderCellClass(index, fields.length)}
              >
                {field.label}
              </th>
            ))}
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
          {/* Rows 1-4: one per activity → numbered 8–11 per SF-424A */}
          {ACTIVITY_ITEMS.map((rowIndex) => (
            <tr key={`row-${rowIndex}`} className="sf424a__row">
              <th
                scope="row"
                className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom"
              >
                <span className="text-bold text-no-wrap margin-right-1">
                  {rowIndex + 8}.
                </span>
              </th>

              {/* Column A: grant program (display only) + carriers */}
              <th
                scope="row"
                className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom"
              >
                {titleCell(rowIndex)}
              </th>

              {/* Columns B-D: Applicant, State, Other */}
              <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom">
                {cellInput(rowIndex, "applicant_amount")}
              </td>
              <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom">
                {cellInput(rowIndex, "state_amount")}
              </td>
              <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom">
                {cellInput(rowIndex, "other_amount")}
              </td>

              {/* Visual equals column */}
              <td
                className="border-bottom-0 border-top-0 verticle-align-bottom"
                aria-hidden="true"
              >
                =
              </td>

              {/* Column E: Total for the row */}
              <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom">
                {rowTotalInput(rowIndex)}
              </td>
            </tr>
          ))}

          {/* Row 5 (12): TOTALS */}
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
              <div className="display-flex flex-column">
                <div className="margin-top-auto">
                  Total
                  <div className="text-italic">(sum of rows 8-11)</div>
                </div>
              </div>
            </th>
            <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell">
              {totalInput("applicant_amount")}
            </td>
            <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell">
              {totalInput("state_amount")}
            </td>
            <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell">
              {totalInput("other_amount")}
            </td>
            <td
              aria-hidden="true"
              className="padding-05 border-bottom-0 border-top-0"
            >
              &nbsp;
            </td>
            <td className="padding-05 border-bottom-0 border-top-0 sf424a__cell">
              {totalInput("total_amount")}
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default Budget424aSectionC;
