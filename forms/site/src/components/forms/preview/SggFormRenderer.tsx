import type { RJSFSchema } from "@rjsf/utils";
import {
  buildWarningTree,
  processFormSchema,
} from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { useEffect, useMemo, useRef, type FormEvent } from "react";

import { collectPreviewForm } from "../../../lib/collectPreviewData";
import {
  completeWarnings,
  createAjv,
  toValidationWarnings,
  uniqueWarnings,
} from "../../../lib/validation";
import { JsonFormsFields } from "../../../vendor/sgg/JsonFormsFields";
import { jsonFormsToUiSchema } from "../../../vendor/sgg/jsonFormsUiSchema";
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
    () => jsonFormsToUiSchema(uischema, formSchema),
    [uischema, formSchema],
  );
  const validate = useMemo(() => createAjv().compile(schema), [schema]);

  // Ajv stands in for the API's validator; the frontend attaches and words the warnings.
  const warningsFor = (next: unknown) => {
    validate(next);
    const raw = toValidationWarnings(validate.errors ?? []);
    return uniqueWarnings(
      completeWarnings(
        raw,
        buildWarningTree(sggUiSchema, null, raw, formSchema),
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

  // Keep shown warnings current while editing without remounting uncontrolled inputs.
  const errors = useMemo(
    () => (showErrors ? warningsFor(data) : null),
    [showErrors, data, sggUiSchema, formSchema],
  );

  const report = (next: unknown) =>
    onChange(
      next,
      warningsFor(next).map((warning) => warning.formatted ?? warning.message),
    );

  // Data replaced from outside still needs its warnings reported.
  useEffect(() => report(data), [generation.current, formSchema]);

  const handleInput = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const currentGeneration = generation.current;
    // Stateful stock widgets commit named hidden controls after their event handler.
    // Read after that commit, including button-driven selection removal.
    queueMicrotask(() => {
      if (!form.isConnected || currentGeneration !== generation.current) return;
      const next = collectPreviewForm(form, formSchema, data);
      reported.current = next;
      report(next);
    });
  };

  return (
    <form
      className="flex-1 margin-top-2 simpler-apply-form"
      onInput={handleInput}
      onChange={handleInput}
      onClick={handleInput}
      onKeyUp={handleInput}
      onKeyDown={handleInput}
      onBlur={handleInput}
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
        collectData={collectPreviewForm}
      />
    </form>
  );
};
