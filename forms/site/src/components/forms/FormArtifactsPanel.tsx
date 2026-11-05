import { useStore } from "@nanostores/react";
import { useEffect, useRef, useState } from "react";

import { signalFormStateReady } from "../../lib/formHydration";
import type { FormFile } from "../../lib/formSpec";
import { $schemaFile, $sourceFile } from "../../stores/formArtifacts";
import HighlightedCode from "./preview/HighlightedCode";

/** Generated files and local source share the Data tab's one-file-at-a-time controls. */
export default function FormArtifactsPanel({
  kind,
  files,
  absent = [],
}: {
  kind: "schemas" | "source";
  files: FormFile[];
  absent?: string[];
}) {
  const boundary = useRef<HTMLDivElement>(null);
  useEffect(() => signalFormStateReady(boundary.current), []);
  const selection = kind === "schemas" ? $schemaFile : $sourceFile;
  const name = useStore(selection);
  const file = files.find((entry) => entry.name === name) ?? files[0];
  const [copyResult, setCopyResult] = useState<{
    name: string;
    text: string;
  }>();
  if (!file) return <p>No source files are available for this form.</p>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.code);
      setCopyResult({ name: file.name, text: `Copied ${file.name}.` });
    } catch {
      setCopyResult({
        name: file.name,
        text: "Copy was unavailable. Download the file instead.",
      });
    }
  };

  return (
    <div
      ref={boundary}
      className="form-artifacts"
      data-artifact-kind={kind}
      data-form-state-boundary
    >
      <ul
        className="usa-button-group usa-button-group--segmented margin-bottom-2"
        aria-label={kind === "schemas" ? "Schema files" : "Source files"}
      >
        {files.map((option) => (
          <li key={option.name} className="usa-button-group__item">
            <button
              type="button"
              className={`usa-button${option === file ? "" : " usa-button--outline"}`}
              aria-pressed={option === file}
              onClick={() => {
                selection.set(option.name);
                setCopyResult(undefined);
              }}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
      {file.name !== name && (
        <p role="status">
          The requested file is unavailable. Showing {file.name}.
        </p>
      )}
      <div className="form-artifacts__tools">
        <code>{file.name}</code>
        <button
          type="button"
          className="usa-button usa-button--unstyled"
          onClick={copy}
        >
          Copy file
        </button>
        <a
          href={`data:${file.lang === "json" ? "application/json" : "text/plain"};charset=utf-8,${encodeURIComponent(file.code)}`}
          download={file.name}
        >
          Download file
        </a>
        {file.sourceUrl && <a href={file.sourceUrl}>View on GitHub</a>}
      </div>
      <p className="form-artifacts__copy-result" role="status">
        {copyResult?.name === file.name ? copyResult.text : ""}
      </p>
      <HighlightedCode
        key={file.name}
        code={file.code}
        lang={file.lang}
        foldable
      />
      {absent.length > 0 && <p className="text-base">{absent.join(" ")}</p>}
    </div>
  );
}
