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
import { getBudgetErrors } from "./budgetErrorLabels";
import { BaseActivityItem, MoneyString } from "./budgetTypes";
import { CurrencyInput, HelperText } from "./budgetUiComponents";
import { asMoney, getStringOrUndefined, isRecord } from "./budgetValueGuards";

interface FederalFundEstimates {
  first_year_amount?: MoneyString;
  second_year_amount?: MoneyString;
  third_year_amount?: MoneyString;
  fourth_year_amount?: MoneyString;
}

interface ActivityItem extends BaseActivityItem {
  budget_summary?: { total_amount?: MoneyString };
  federal_fund_estimates?: FederalFundEstimates;
}

type NormalizedE = {
  items: ActivityItem[];
  totals?: FederalFundEstimates;
};

function pickFederalFundEstimates(value: unknown): FederalFundEstimates {
  if (!isRecord(value)) return {};
  return {
    first_year_amount: asMoney(value.first_year_amount),
    second_year_amount: asMoney(value.second_year_amount),
    third_year_amount: asMoney(value.third_year_amount),
    fourth_year_amount: asMoney(value.fourth_year_amount),
  };
}

function pickActivityItem(value: unknown): ActivityItem {
  if (!isRecord(value)) return {};
  const activity: ActivityItem = {};
  if (typeof value.activity_title === "string") {
    activity.activity_title = value.activity_title;
  }
  if (typeof value.assistance_listing_number === "string") {
    activity.assistance_listing_number = value.assistance_listing_number;
  }
  if (isRecord(value.budget_summary)) {
    activity.budget_summary = {
      total_amount: asMoney(value.budget_summary.total_amount),
    };
  }
  if (isRecord(value.federal_fund_estimates)) {
    activity.federal_fund_estimates = pickFederalFundEstimates(
      value.federal_fund_estimates,
    );
  }
  return activity;
}

function normalizeSectionEValue(rawValue: unknown): NormalizedE {
  if (Array.isArray(rawValue)) {
    return { items: rawValue.map(pickActivityItem) };
  }
  if (isRecord(rawValue)) {
    const itemsProp = rawValue.activity_line_items;
    const totalsProp = rawValue.total_federal_fund_estimates;
    if (Array.isArray(itemsProp)) {
      return {
        items: itemsProp.map(pickActivityItem),
        totals: pickFederalFundEstimates(totalsProp),
      };
    }

    const items: ActivityItem[] = [];
    for (const index of BUDGET_ACTIVITY_COLUMNS) {
      items.push(pickActivityItem(rawValue[String(index)]));
    }
    let totals: FederalFundEstimates | undefined;
    if (isRecord(totalsProp)) {
      totals = pickFederalFundEstimates(totalsProp);
    } else {
      const rootTotals = pickFederalFundEstimates(rawValue);
      const hasAny =
        rootTotals.first_year_amount ||
        rootTotals.second_year_amount ||
        rootTotals.third_year_amount ||
        rootTotals.fourth_year_amount;
      totals = hasAny ? rootTotals : undefined;
    }
    return { items, totals };
  }
  return { items: [] };
}

function Budget424aSectionE<
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
  const { items: activityItems, totals } = normalizeSectionEValue(rawValue);

  function getErrorMessagesForField(fieldId: string): string[] {
    return getBudgetErrors({ errors, id: fieldId, section: "C" });
  }

  const ROWS = BUDGET_ACTIVITY_COLUMNS;

  const YEARS = [
    { key: "first_year_amount", short: "First year", colLabel: "B" },
    { key: "second_year_amount", short: "Second year", colLabel: "C" },
    { key: "third_year_amount", short: "Third year", colLabel: "D" },
    { key: "fourth_year_amount", short: "Fourth year", colLabel: "E" },
  ] as const;

  type YearKey = (typeof YEARS)[number]["key"];

  const titleCell = (rowIndex: number): JSX.Element => {
    const title =
      getStringOrUndefined(activityItems, `[${rowIndex}].activity_title`) ?? "";
    const assistanceListingNumber =
      getStringOrUndefined(
        activityItems,
        `[${rowIndex}].assistance_listing_number`,
      ) ?? "";

    return (
      <div className="display-flex flex-column">
        <div className="minw-15 font-sans-sm text-italic">
          {title.trim() ? title : "—"}
        </div>
        {assistanceListingNumber.trim() ? (
          <div className="font-sans-3xs text-base-dark text-italic">
            CFDA: {assistanceListingNumber}
          </div>
        ) : null}
      </div>
    );
  };

  const cellInput = (rowIndex: number, yearKey: YearKey): JSX.Element => {
    const idPath = `activity_line_items[${rowIndex}]--federal_fund_estimates--${yearKey}`;
    return (
      <CurrencyInput
        id={idPath}
        rawErrors={getErrorMessagesForField(idPath)}
        value={get(
          activityItems,
          `[${rowIndex}].federal_fund_estimates.${yearKey}`,
        )}
      />
    );
  };

  const totalInput = (yearKey: YearKey, helper: string): JSX.Element => {
    const idPath = `total_federal_fund_estimates--${yearKey}`;
    return (
      <div className="display-flex flex-column">
        <HelperText hasHorizontalLine>{helper}</HelperText>
        <CurrencyInput
          id={idPath}
          rawErrors={getErrorMessagesForField(idPath)}
          value={totals ? totals[yearKey] : undefined}
          bordered
        />
      </div>
    );
  };

  const totalHelpersByYear: Record<YearKey, string> = {
    first_year_amount: "Sum of column B",
    second_year_amount: "Sum of column C",
    third_year_amount: "Sum of column D",
    fourth_year_amount: "Sum of column E",
  };

  return (
    <div key={id} id={id}>
      <Table
        bordered={false}
        className="sf424__table usa-table--borderless width-full border-1px border-base-light table-layout-auto"
      >
        <thead>
          <tr>
            <th
              colSpan={2}
              className="bg-base-lightest text-bold border-x-1px border-bottom-0 border-base-light"
            >
              &nbsp;
            </th>
            <th
              scope="col"
              colSpan={4}
              className="bg-base-lightest text-bold text-center width-card border-base-light"
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
            {YEARS.map((year) => (
              <th
                key={year.key}
                scope="col"
                className="bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light"
              >
                {year.short}
              </th>
            ))}
          </tr>
          <tr className="bg-base-lighter">
            <th className="bg-base-lightest border-top-0 border-left-0 border-right-0 border-x-1px border-base-light">
              &nbsp;
            </th>
            <th
              scope="col"
              className="bg-base-lightest text-bold border-top-0 border-left-0 border-x-1px text-center border-base-light"
            >
              A
            </th>
            {YEARS.map((year) => (
              <th
                key={`col-${year.colLabel}`}
                className="bg-base-lightest text-bold border-top-0 border-x-1px text-center border-base-light"
              >
                {year.colLabel}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {ROWS.map((rowIndex) => (
            <tr key={`row-${rowIndex}`} className="sf424a__row">
              <td className="border-bottom-0 border-top-0 verticle-align-bottom">
                {rowIndex + 16}.
              </td>

              <th
                scope="row"
                className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom"
              >
                {titleCell(rowIndex)}
              </th>

              {YEARS.map((year) => (
                <td
                  key={`${rowIndex}-${year.key}`}
                  className="padding-05 border-bottom-0 border-top-0 sf424a__cell verticle-align-bottom"
                >
                  {cellInput(rowIndex, year.key)}
                </td>
              ))}
            </tr>
          ))}

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
            {YEARS.map((year) => (
              <td
                key={`total-${year.key}`}
                className="padding-05 border-bottom-0 border-top-0 sf424a__cell"
              >
                {totalInput(year.key, totalHelpersByYear[year.key])}
              </td>
            ))}
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default Budget424aSectionE;
