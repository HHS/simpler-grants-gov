import type { RJSFSchema } from "@rjsf/utils";
import {
  buildWarningTree,
  processFormSchema,
  shapeFormData,
} from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { JsonFormsFields } from "@sgg/frontend/components/apply-form/jsonforms/JsonFormsFields";
import { convertJsonFormsUiSchema } from "@sgg/frontend/components/apply-form/jsonforms/convertUiSchema";
import { useEffect, useMemo, useRef, type FormEvent } from "react";

import {
  createAjv,
  toValidationWarnings,
  uniqueWarnings,
} from "../../../lib/validation";
import { previewRenderers } from "./renderers";
import type { FormRendererProps } from "./types";

/**
 * The SGG apply form's own widgets, laid out by JSON Forms the way the frontend's JSON Forms
 * renderer does it.
 *
 * Those widgets are uncontrolled: like the apply form, values live in the native `<form>`
 * and are shaped into JSON from its FormData. So the form is remounted only when the data
 * changes from outside (loading the sample, clearing, checking for errors); typing just
 * reports the shaped data back up.
 */
export const SggFormRenderer = ({
  schema,
  uischema,
  data,
  showErrors,
  onChange,
}: FormRendererProps) => {
  const formSchema = useMemo(
    () => processFormSchema(schema as RJSFSchema).formSchema as RJSFSchema,
    [schema],
  );
  const sggUiSchema = useMemo(
    () => convertJsonFormsUiSchema(uischema, formSchema).uiSchema,
    [uischema, formSchema],
  );
  const validate = useMemo(() => createAjv().compile(schema), [schema]);

  // Ajv stands in for the API's validator; the frontend attaches and words the warnings.
  const warningsFor = (next: unknown) => {
    validate(next);
    return uniqueWarnings(
      buildWarningTree(
        sggUiSchema,
        null,
        toValidationWarnings(validate.errors ?? []),
        formSchema,
      ),
    );
  };

  // The data this form last reported; anything else arriving as `data` came from outside.
  const reported = useRef<unknown>(data);
  const generation = useRef(0);
  if (data !== reported.current) {
    reported.current = data;
    generation.current += 1;
  }

  // Warnings are shown the way the apply form shows them after a save: computed once from
  // the data at the time, then left alone while the applicant edits.
  const errors = useMemo(
    () => (showErrors ? warningsFor(data) : null),
    [showErrors, generation.current, sggUiSchema, formSchema],
  );

  const report = (next: unknown) =>
    onChange(
      next,
      warningsFor(next).map((warning) => warning.formatted ?? warning.message),
    );

  // Data replaced from outside still needs its warnings reported.
  useEffect(() => report(data), [generation.current, formSchema]);

  const handleInput = (event: FormEvent<HTMLFormElement>) => {
    const next = shapeFormData(new FormData(event.currentTarget), formSchema);
    reported.current = next;
    report(next);
  };

  return (
    <form
      className="flex-1 margin-top-2 simpler-apply-form"
      onInput={handleInput}
      onChange={handleInput}
      onSubmit={(event) => event.preventDefault()}
      noValidate
    >
      <JsonFormsFields
        key={`${generation.current}-${showErrors}`}
        errors={errors}
        formData={data as object}
        schema={formSchema}
        uiSchema={uischema}
        extraRenderers={previewRenderers}
      />
    </form>
  );
};
