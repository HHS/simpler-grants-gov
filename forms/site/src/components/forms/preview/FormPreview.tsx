import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { useStore } from "@nanostores/react";
import { useCallback, useId, useRef, useState } from "react";

import { FormRenderer } from ".";
import { $previewData } from "../../../stores/formPreview";
import FormOutline from "./sections/FormOutline";
import SectionBreadcrumb from "./sections/SectionBreadcrumb";
import { useSectionTrail } from "./sections/useSectionTrail";

interface Props {
  schema: JsonSchema & { examples?: Record<string, unknown>[] };
  uischema: UISchemaElement;
  /** The form's first `@example` from the TypeSpec. */
  example?: Record<string, unknown>;
}

/** An interactive form, starting empty; the data it produces is shown in the Data tab. */
export default function FormPreview({ schema, uischema, example }: Props) {
  const data = useStore($previewData);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(0);
  const sampleId = useId();
  const samples = schema.examples ?? (example ? [example] : []);
  const form = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const { sections, trail, goTo } = useSectionTrail(form, bar);

  const onChange = useCallback((next: unknown, nextWarnings: string[]) => {
    $previewData.set(next);
    setWarnings(nextWarnings);
  }, []);

  const reset = (next: unknown) => {
    $previewData.set(next);
    setShowErrors(false);
  };

  return (
    <div className="form-preview">
      <div className="form-preview__actions">
        {samples.length > 1 && (
          <div>
            <label htmlFor={sampleId}>Sample case</label>
            <select
              id={sampleId}
              className="usa-select margin-top-0"
              value={sampleIndex}
              onChange={(event) => setSampleIndex(Number(event.target.value))}
            >
              {samples.map((_, index) => (
                <option key={index} value={index}>
                  Sample {index + 1} of {samples.length}
                </option>
              ))}
            </select>
          </div>
        )}
        {samples.length > 0 && (
          <button
            type="button"
            className="usa-button"
            onClick={() => reset(structuredClone(samples[sampleIndex]))}
          >
            Load sample data
          </button>
        )}
        <button
          type="button"
          className="usa-button usa-button--outline"
          onClick={() => reset({})}
        >
          Clear
        </button>
        <button
          type="button"
          className="usa-button usa-button--secondary"
          onClick={() => {
            // A fresh copy makes the renderer re-check what is in the form now.
            $previewData.set(structuredClone(data));
            setShowErrors(true);
          }}
        >
          Check for errors
        </button>
      </div>

      {showErrors && (
        <div
          className={`usa-alert usa-alert--slim ${warnings.length ? "usa-alert--warning" : "usa-alert--success"}`}
          role="status"
        >
          <div className="usa-alert__body">
            {warnings.length ? (
              <>
                <p className="usa-alert__text">
                  {warnings.length}{" "}
                  {warnings.length === 1 ? "issue needs" : "issues need"}{" "}
                  attention:
                </p>
                <ul className="usa-list">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="usa-alert__text">No errors found.</p>
            )}
          </div>
        </div>
      )}

      <div className="usa-in-page-nav-container form-preview__body">
        <div className="order-2 width-full form-preview__main">
          <SectionBreadcrumb ref={bar} trail={trail} goTo={goTo} />
          <div className="form-preview__form" ref={form}>
            <FormRenderer
              schema={schema}
              uischema={uischema}
              data={data}
              showErrors={showErrors}
              onChange={onChange}
            />
          </div>
        </div>
        <FormOutline sections={sections} trail={trail} goTo={goTo} />
      </div>
    </div>
  );
}
