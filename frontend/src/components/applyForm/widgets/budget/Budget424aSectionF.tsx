/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { get } from "lodash";

import React from "react";

import {
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";

function Budget424aSectionF<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  value: rawValue = {},
  rawErrors,
  options,
}: UswdsWidgetProps<T, S, F> & { options?: Record<string, unknown> }) {
  const errors = (rawErrors as FormValidationWarning[]) || [];
  const root = rawValue;

  const uiHelpers = (options as Record<string, string>) || {};
  const directChargesHelp =
    uiHelpers.direct_charges_explanation ??
    "Explain amounts for individual direct object class cost categories that may appear to be out of the ordinary or to explain the details as required by the Federal grantor agency.";
  const indirectChargesHelp =
    uiHelpers.indirect_charges_explanation ??
    "Enter the type of indirect rate (provisional, predetermined, final or fixed) that will be in effect during the funding period, the estimated amount of the base to which the rate is applied, and the total of indirect expense.";
  const remarksHelp =
    uiHelpers.remarks ??
    "Provide any other explanations or comments deemed necessary.";

  const getErrors = (fieldId: string) =>
    (errors || []).filter((e) => e.field === fieldId).map((e) => e.message);

  const FieldBlock: React.FC<
    React.PropsWithChildren<{
      label: string;
      helper?: string;
      htmlFor?: string;
    }>
  > = ({ label, helper, htmlFor, children }) => (
    <div className="margin-bottom-4">
      <label
        className="text-bold display-block margin-bottom-05"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {helper ? (
        <div className="font-sans-2xs text-italic margin-bottom-1">
          {helper}
        </div>
      ) : null}
      {children}
    </div>
  );

  const textareaFor = (fieldKey: string, rows = 4) => {
    const idPath = fieldKey;
    const errMsgs = getErrors(idPath);
    const describedById = errMsgs.length ? `${idPath}-error` : undefined;

    return (
      <div className="display-flex flex-column">
        <textarea
          id={idPath}
          name={idPath}
          className="usa-textarea minw-30"
          rows={rows}
          aria-invalid={errMsgs.length ? true : undefined}
          aria-describedby={describedById}
          defaultValue={get(root, fieldKey) ?? ""}
        />
        {errMsgs.length ? (
          <div id={describedById} className="usa-error-message margin-top-1">
            {errMsgs.join(" ")}
          </div>
        ) : null}
      </div>
    );
  };

  // Yes/No radio group for confirmation (maps to boolean)
  const confirmationRadios = () => {
    const idBase = "confirmation";
    const errMsgs = getErrors(idBase);
    const describedById = errMsgs.length ? `${idBase}-error` : `${idBase}-hint`;

    const currentVal = get(root, "confirmation");
    const checkedYes = currentVal === true;
    const checkedNo = currentVal === false;

    return (
      <fieldset className="usa-fieldset">
        <legend className="usa-sr-only">Confirmation</legend>
        <div className="usa-radio">
          <input
            className="usa-radio__input"
            id={`${idBase}-yes`}
            type="radio"
            name={idBase}
            value="yes"
            aria-describedby={describedById}
            defaultChecked={checkedYes}
          />
          <label className="usa-radio__label" htmlFor={`${idBase}-yes`}>
            Yes
          </label>
        </div>
        <div className="usa-radio">
          <input
            className="usa-radio__input"
            id={`${idBase}-no`}
            type="radio"
            name={idBase}
            value="no"
            aria-describedby={describedById}
            defaultChecked={checkedNo}
          />
          <label className="usa-radio__label" htmlFor={`${idBase}-no`}>
            No
          </label>
        </div>

        {errMsgs.length ? (
          <div
            id={`${idBase}-error`}
            className="usa-error-message margin-top-1"
          >
            {errMsgs.join(" ")}
          </div>
        ) : null}
      </fieldset>
    );
  };

  return (
    <div key={id} id={id}>
      <p className="margin-bottom-3">
        Provide additional budget information as needed.
      </p>

      <FieldBlock
        label="21. Direct charges"
        helper={directChargesHelp}
        htmlFor="direct_charges_explanation"
      >
        {textareaFor("direct_charges_explanation", 4)}
      </FieldBlock>

      <FieldBlock
        label="22. Indirect charges"
        helper={indirectChargesHelp}
        htmlFor="indirect_charges_explanation"
      >
        {textareaFor("indirect_charges_explanation", 4)}
      </FieldBlock>

      <FieldBlock label="23. Remarks" helper={remarksHelp} htmlFor="remarks">
        {textareaFor("remarks", 6)}
      </FieldBlock>

      <FieldBlock
        label="Confirmation"
        helper="Is this form complete?"
        htmlFor="confirmation"
      >
        {confirmationRadios()}
      </FieldBlock>
    </div>
  );
}

export default Budget424aSectionF;
