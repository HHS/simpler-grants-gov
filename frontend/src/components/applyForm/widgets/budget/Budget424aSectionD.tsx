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

function Budget424aSectionD<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({ id, value: rawValue = {}, rawErrors }: UswdsWidgetProps<T, S, F>) {
  const errors = (rawErrors as FormValidationWarning[]) || [];

  // Accept either:
  //  A) value = forecasted_cash_needs (object)
  //  B) value = { forecasted_cash_needs: {...} }
  const root: AnyObj =
    (get(rawValue as AnyObj, "forecasted_cash_needs") as AnyObj) || (rawValue as AnyObj);

  const amountSchema = {
    type: "string" as const,
    pattern: "^\\d*([.]\\d{2})?$",
    maxLength: 14,
  };

  const quarters = [
    { key: "first_quarter_amount", label: "1st Quarter" },
    { key: "second_quarter_amount", label: "2nd Quarter" },
    { key: "third_quarter_amount", label: "3rd Quarter" },
    { key: "fourth_quarter_amount", label: "4th Quarter" },
    { key: "total_amount", label: "Total (Year 1)" },
  ] as const;

  const rows = [
    { key: "federal_forecasted_cash_needs", label: "13. Federal" },
    { key: "non_federal_forecasted_cash_needs", label: "14. Non-federal" },
    { key: "total_forecasted_cash_needs", label: "15. TOTAL" },
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

  const cellInput = ({
    rowKey,
    colKey,
  }: {
    rowKey: string;
    colKey: string;
  }) => {
    const idPath = `forecasted_cash_needs--${rowKey}--${colKey}`;
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
        value={get(root, `${rowKey}.${colKey}`)}
      />
    );
  };

  return (
    <div key={id} id={id}>
        <p>Enter the forecasted cash needs from federal and non-federal sources for each quarter of the first program year.</p>
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
              &nbsp;
            </th>
            {quarters.map((q) => (
              <th
                key={q.key}
                scope="col"
                className="bg-base-lightest text-bold border-bottom-0 border-x-1px text-center border-base-light"
              >
                {q.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row" className="padding-05 text-bold">
                {r.label}
              </th>
              {quarters.map((q) => (
                <td key={`${r.key}-${q.key}`} className="padding-05">
                  {cellInput({ rowKey: r.key, colKey: q.key })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default Budget424aSectionD;
