import type { RJSFSchema } from "@rjsf/utils";
import {
  buildWarningTree,
  getFieldSchema,
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

  // Ajv stands in for the API validator; raw failures remain visible if formatting omits them.
  const warningsFor = (next: unknown) => {
    validate(next);
    const preview = toValidationWarnings(validate.errors ?? []);
    return uniqueWarnings(
      completeWarnings(
        preview,
        buildWarningTree(sggUiSchema, null, preview, formSchema),
      ),
    ).map((warning) => {
      // Presentation only: validation.ts retains the API-shaped errors. Do not echo
      // a long or sensitive answer, or expose a regex as applicant instructions.
      if (
        !["minLength", "maxLength", "pattern", "format"].includes(
          warning.type,
        ) ||
        !("definition" in warning) ||
        !warning.definition
      )
        return warning;
      const field = getFieldSchema({
        definition: warning.definition,
        formSchema,
        schema: undefined,
      });
      const label = (field?.title || warning.field).replace(/:\s*$/, "");
      if (warning.type === "format") {
        if (field?.format !== "email") return warning;
        const message = `${label}: Enter a valid email address.`;
        return { ...warning, message, formatted: message };
      }
      const message =
        warning.type === "maxLength" && typeof field?.maxLength === "number"
          ? `${label} must be ${field.maxLength} characters or fewer.`
          : warning.type === "minLength" && typeof field?.minLength === "number"
            ? `${label} must be at least ${field.minLength} characters.`
            : `${label}: ${field?.description?.split(/\n\s*\n/)[0] || "Review the field instructions."}`;
      return { ...warning, message, formatted: message };
    });
  };

  // The data this form last reported; anything else arriving as `data` came from outside.
  const reported = useRef<unknown>(data);
  const widgetLists = useRef(new Set<string>());
  const nativeForm = useRef<HTMLFormElement>(null);
  const generation = useRef(0);
  if (data !== reported.current) {
    reported.current = data;
    widgetLists.current.clear();
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
      const next = collectPreviewForm(
        form,
        formSchema,
        reported.current,
        widgetLists.current,
      );
      reported.current = next;
      report(next);
    });
  };

  // ComboBox option clicks can commit their named hidden inputs in a follow-up
  // React update, after the event microtask. Observe that native submission value,
  // rather than guessing a delay or keeping a second selection model.
  useEffect(() => {
    const form = nativeForm.current;
    if (!form) return;
    const hiddenInput = (node: Node) =>
      node instanceof Element &&
      (node.matches('input[type="hidden"][name]') ||
        Boolean(node.querySelector('input[type="hidden"][name]')));
    const observer = new MutationObserver((records) => {
      if (
        !records.some((record) =>
          record.type === "attributes"
            ? hiddenInput(record.target)
            : [...record.addedNodes, ...record.removedNodes].some(hiddenInput),
        )
      )
        return;
      const next = collectPreviewForm(
        form,
        formSchema,
        reported.current,
        widgetLists.current,
      );
      reported.current = next;
      report(next);
    });
    observer.observe(form, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["value"],
    });
    return () => observer.disconnect();
  }, [generation.current, formSchema]);

  const handleFieldListChange = (name: string, values: unknown[]) => {
    widgetLists.current.add(name);
    const next = {
      ...(reported.current as Record<string, unknown>),
      [name]: values,
    };
    reported.current = next;
    report(next);
  };

  return (
    <form
      ref={nativeForm}
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
        onFieldListChange={handleFieldListChange}
      />
    </form>
  );
};
