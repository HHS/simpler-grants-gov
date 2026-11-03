import path from "node:path";

import { compile, NodeHost } from "@typespec/compiler";
import { xsdRoots } from "form-library-xml";
import { describe, expect, it } from "vitest";

import { xsdModelFields } from "./harness/flatten/xsdModels.ts";
import { xsdFields } from "./harness/flatten/xsd.ts";
import { comparePair, report, type Discrepancy } from "./harness/index.ts";
import { FORMS_ROOT, readSource } from "./harness/load.ts";

/**
 * Whether each XSD TypeSpec model (a form's `xsd.tsp`, or a shared one in `specs/xsd/`) says
 * what the Grants.gov XSD it models says. The XML transform rules are read off these models,
 * so an element misnamed, put in the wrong namespace, out of sequence, or required where the
 * XSD makes it optional here would be emitted that way.
 *
 * Compiled in memory, not read from an emitted file: nothing is written, and a model
 * no form links to yet is checked all the same.
 */
const program = await compile(
  NodeHost,
  path.join(FORMS_ROOT, "specs/main.tsp"),
  {
    noEmit: true,
  },
);

const SPEC = {
  subject: "plan",
  order: true,
  // Requiredness is compared with every constraint list.
  constraints: { keywords: ["namespace"], mode: "equal" },
  occurrences: "equal",
} as const;

const ROOTS = [...xsdRoots(program)].map(([model, url]) => ({
  name: `${model.namespace?.name}.${model.name}`,
  model,
  url,
}));

function expectNone(found: readonly Discrepancy[], header: string) {
  expect(found.length, report(header, found)).toBe(0);
}

describe("XSD TypeSpec models", () => {
  it("compile without errors", () => {
    expect(program.diagnostics.filter((d) => d.severity === "error")).toEqual(
      [],
    );
  });

  it("are declared for at least one XSD", () => {
    expect(ROOTS.length).toBeGreaterThan(0);
  });
});

describe.each(ROOTS)("$name vs $url", ({ model, url }) => {
  const result = comparePair(
    {
      registers: {},
      plan: xsdModelFields(program, model),
      source: xsdFields(url, (source) => readSource(source).toString("utf8")),
    },
    SPEC,
  );
  const ofKind = (kind: string) =>
    result.fieldConstraints.filter((d) => d.kind === kind);

  it("has no missing elements", () => {
    expectNone(result.missingFields, "XSD elements the model lacks:");
  });

  it("has no extra elements", () => {
    expectNone(result.extraFields, "Model elements the XSD lacks:");
  });

  it("matches element order", () => {
    expectNone(result.fieldOrder, "Model elements out of XSD order:");
  });

  it("matches requiredness", () => {
    expectNone(
      ofKind("requiredness differs"),
      "Elements whose requiredness differs from the XSD:",
    );
  });

  it("matches occurrences", () => {
    expectNone(
      result.fieldOccurrences,
      "Elements whose occurrences differ from the XSD:",
    );
  });

  it("matches namespaces", () => {
    expectNone(
      ofKind("namespace differs"),
      "Elements in a different namespace than the XSD puts them in:",
    );
  });
});
