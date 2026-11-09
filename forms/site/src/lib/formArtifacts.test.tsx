import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import FormArtifactsPanel from "../components/forms/FormArtifactsPanel";
import { $schemaFile, $sourceFile } from "../stores/formArtifacts";

afterEach(() => {
  $schemaFile.set("schema.json");
  $sourceFile.set("index.tsp");
});

describe("artifact file controls", () => {
  const code = '{\n  "name": "A < B",\n  "nested": {"retained": true}\n}\n';
  const files = [
    { name: "schema.json", label: "JSON Schema", code, lang: "json" as const },
    {
      name: "ui.json",
      label: "UI schema",
      code: '{"type":"Group"}\n',
      lang: "json" as const,
    },
  ];

  it("offers complete file downloads, including nested content and the final newline", () => {
    const html = renderToStaticMarkup(
      <FormArtifactsPanel kind="schemas" files={files} />,
    );
    const href = html.match(
      /href="data:application\/json;charset=utf-8,([^"]+)"/,
    )?.[1];
    expect(decodeURIComponent(href!)).toBe(code);
    expect(html).toContain('download="schema.json"');
    expect(html).toContain("Copy file");
    expect(html).toContain('aria-label="Schema files"');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  });

  it("renders only the selected file and explains absent optional artifacts", () => {
    $schemaFile.set("ui.json");
    const html = renderToStaticMarkup(
      <FormArtifactsPanel
        kind="schemas"
        files={files}
        absent={["This form has no rules schema."]}
      />,
    );
    expect(html).toContain('download="ui.json"');
    expect(html).not.toContain('download="schema.json"');
    expect(html).toContain("This form has no rules schema.");
  });

  it("handles a stale file selection without mutating state during rendering", () => {
    $schemaFile.set("removed.json");
    const html = renderToStaticMarkup(
      <FormArtifactsPanel kind="schemas" files={files} />,
    );
    expect(html).toContain("requested file is unavailable");
    expect(html).toContain('download="schema.json"');
    expect($schemaFile.get()).toBe("removed.json");
  });

  it("provides an immutable source link and full TypeSpec download", () => {
    const source = {
      name: "index.tsp",
      label: "index.tsp",
      code: 'import "./form.tsp";\n',
      lang: "typespec" as const,
      sourceUrl: `https://github.com/HHS/simpler-grants-gov/blob/${"a".repeat(40)}/forms/specs/forms/example/index.tsp`,
    };
    const html = renderToStaticMarkup(
      <FormArtifactsPanel kind="source" files={[source]} />,
    );
    expect(html).toContain(source.sourceUrl);
    expect(html).toContain('download="index.tsp"');
    expect(html).toContain(
      "data:text/plain;charset=utf-8,import%20%22.%2Fform.tsp%22%3B%0A",
    );
  });
});
