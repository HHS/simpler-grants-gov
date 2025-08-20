/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from "react";
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { get } from "lodash";
import { Table } from "@trussworks/react-uswds";
import {
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import TextWidget from "src/components/applyForm/widgets/TextWidget";

type AnyObj = Record<string, any>;

function Budget424aSectionE<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({ id, value: rawValue = [], rawErrors }: UswdsWidgetProps<T, S, F>) {
  const errors = (rawErrors as FormValidationWarning[]) || [];

  // Accept either:
  //  A) value = activity_line_items (array)
  //  B) value = { activity_line_items: [...], total_federal_fund_estimates: {...} }
  const activityItems: AnyObj[] = Array.isArray(rawValue)
    ? (rawValue as AnyObj[])
    : (get(rawValue as AnyObj, "activity_line_items") as AnyObj[]) || [];

  const totals: AnyObj | undefined = Array.isArray(rawValue)
    ? undefined
    : ((rawValue as AnyObj).total_federal_fund_estimates as AnyObj) || undefined;

  const COLUMNS = [0, 1, 2, 3] as const; // hardcoded 1–4

  const amountSchema = {
    type: "string" as const,
    pattern: "^\\d*([.]\\d{2})?$",
    maxLength: 14,
  };

  const years = [
    { key: "first_year_amount", label: "Grant program" },
    { key: "second_year_amount", label: "Grant program" },
    { key: "third_year_amount", label: "Grant program" },
    { key: "fourth_year_amount", label: "Grant program" },
  ] as const;

  const localGetErrors = ({
    errors,
    id,
  }: {
    id: string;
    errors: FormValidationWarning[];
  }) =>
    (errors || [])
      .filter((e) => e.field === id)
      .map((e) => e.message);

  const cellInput = ({ yearKey, actIdx }: { yearKey: string; actIdx: number }) => {
    const idPath = `activity_line_items[${actIdx}]--federal_fund_estimates--${yearKey}`;
    return (
      <TextWidget
        schema={amountSchema}
        id={idPath}
        rawErrors={localGetErrors({ errors, id: idPath })}
        formClassName="margin-top-1 simpler-currency-input-wrapper"
        inputClassName="minw-10"
        inputMode="decimal"
        pattern="\\d*(\\.\\d{2})?"
        maxLength={14}
        value={get(activityItems, `[${actIdx}].federal_fund_estimates.${yearKey}`)}
      />
    );
  };

  const totalInput = ({ yearKey }: { yearKey: string }) => {
    const idPath = `total_federal_fund_estimates--${yearKey}`;
    return (
      <TextWidget
        schema={amountSchema}
        id={idPath}
        rawErrors={localGetErrors({ errors, id: idPath })}
        formClassName="margin-top-1 simpler-currency-input-wrapper"
        inputClassName="minw-10 border-2px"
        inputMode="decimal"
        pattern="\\d*(\\.\\d{2})?"
        maxLength={14}
        value={totals ? totals[yearKey] : undefined}
      />
    );
  };

  const rowHeader = (label: string) => (
    <th scope="row" className="padding-05 text-bold">
      {label}
    </th>
  );

  const colHeader = (idx: number) => {
    const title = get(activityItems, `[${idx}].activity_title`);
    const aln = get(activityItems, `[${idx}].assistance_listing_number`);
    return (
      <div className="text-center">
        <div className="text-bold">{idx + 1}</div>
        {title ? <div className="font-sans-xs text-italic">{title}</div> : null}
        {aln ? <div className="font-sans-3xs text-base-dark text-italic">CFDA: {aln}</div> : null}
      </div>
    );
  };

  return (
    <div key={id} id={id}>
        <p>Enter the estimated federal funds that will be required in the first, second, third, and fourth funding years for the selected program.</p>
      <Table
        bordered={false}
        className="usa-table--borderless simpler-responsive-table width-full border-1px border-base-light"
      >
        <thead>
          <tr className="bg-base-lighter">
            <th
              scope="col"
              className="bg-base-lightest text-bold border-bottom-0 width-card border-base-light"
            >
              20. Federal funds (estimates)
            </th>
            {COLUMNS.map((i) => (
              <th
                key={`col-${i}`}
                scope="col"
                className="bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light"
              >
                {colHeader(i)}
              </th>
            ))}
            <th
              scope="col"
              className="bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light"
            >
              Total (sum of 1 - 4)
            </th>
          </tr>
        </thead>

        <tbody>
          {years.map((y) => (
            <tr key={y.key}>
              {rowHeader(y.label)}
              {COLUMNS.map((colIdx) => (
                <td key={`${y.key}-${colIdx}`} className="padding-05">
                  {cellInput({ yearKey: y.key, actIdx: colIdx })}
                </td>
              ))}
              <td className="padding-05">{totalInput({ yearKey: y.key })}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default Budget424aSectionE;
