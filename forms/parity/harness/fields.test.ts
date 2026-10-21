import { describe, expect, it } from "vitest";
import { evaluatePairs, type FormPairs } from "./index.ts";
import { projectComparison } from "../comparison.ts";
import type { Plan, PlanField } from "./flatten/plan.ts";
import type { Fields } from "./model.ts";

const fact = { rules: {}, required: "no" as const };
const empty = () => ({ registers: {}, plan: new Map(), source: new Map() });
const one = (path: string, value = fact): Fields => new Map([[path, value]]);
const name: PlanField = {
  kind: "field",
  label: "Name",
  required: false,
  json_path: "a",
  xml_path: "ns:Name",
  dat_field: "1",
};
function fixture(field: PlanField = name): FormPairs {
  const schema = one("a");
  return {
    plan: { slug: "fixture", children: [field] },
    planProblems: [],
    dat: empty(),
    xsd: empty(),
    compiled: {
      schema,
      indexLeaves: new Set(schema.keys()),
      jsonSchema: { registers: {}, plan: one("a"), source: schema },
      uiSchema: { registers: {}, plan: one("a"), source: one("a") },
      jsonSchemaVsXsd: empty(),
    },
  };
}

describe("field-organized evidence", () => {
  it("keeps a same-spelled orphan source separate from a declared rename", () => {
    const pairs = fixture();
    const schema = new Map([
      ["a", fact],
      ["b", fact],
    ]);
    pairs.compiled!.schema = schema;
    pairs.compiled!.indexLeaves = new Set(schema.keys());
    pairs.compiled!.jsonSchema = {
      registers: {
        renamed: {
          a: { to: "b", category: "intentional", reason: "Concept name" },
        },
      },
      plan: one("a"),
      source: schema,
    };
    const e = evaluatePairs(pairs),
      field = e.fields[0];
    const orphan = e.findings.find(
      (f) => f.check === "jsonSchema" && f.kind === "missing from plan",
    )!;
    expect(orphan.anchors).toEqual([{ artifact: "jsonSchema", path: "a" }]);
    expect(field.sources.form.path).toBe("b");
    expect(field.findings).not.toContain(orphan);
    expect(field.outcomes.matchedBy.form).toMatchObject({
      status: "intentional",
      reason: "Concept name",
      findings: [],
    });
    expect(projectComparison(e).findings).toContain(orphan);
  });

  it("associates a reverse XML gap through the actual schema/XSD match", () => {
    const pairs = fixture();
    pairs.compiled!.schema = one("b");
    pairs.compiled!.indexLeaves = new Set(["b"]);
    pairs.compiled!.jsonSchema = {
      registers: {
        renamed: {
          a: { to: "b", category: "intentional", reason: "Concept name" },
        },
      },
      plan: one("a"),
      source: one("b"),
    };
    pairs.xsd = { registers: {}, plan: one("Name"), source: one("Name") };
    const gap = {
      category: "gap" as const,
      reason: "Wrapper support is pending",
    };
    pairs.compiled!.xmlMapping = {
      plan: {
        registers: { absentFromSource: { "a -> Name": gap } },
        plan: one("a -> Name"),
        source: new Map(),
      },
      jsonSchema: {
        registers: { absentFromPlan: { b: gap } },
        plan: new Map(),
        source: one("b"),
      },
      xsd: {
        registers: { absentFromPlan: { Name: gap } },
        plan: new Map(),
        source: one("Name"),
      },
    };
    const e = evaluatePairs(pairs),
      field = e.fields[0];
    const gaps = field.findings.filter((f) => f.check.startsWith("xmlMapping"));
    expect(gaps).toHaveLength(3);
    expect(
      gaps.find((f) => f.check === "xmlMappingVsJsonSchema")?.anchors,
    ).toEqual([{ artifact: "jsonSchema", path: "b" }]);
    expect(field.outcomes.xmlMapping.form).toMatchObject({
      status: "gap",
      reason: gap.reason,
    });
    expect(field.outcomes.xmlMapping.form.findings).toEqual(gaps);
    expect(field.writtenPaths).toEqual([]);
    expect(
      projectComparison(e).fields[0].rows.find(
        (r) => r.attribute === "xmlMapping",
      )?.cells.form.status,
    ).toBe("gap");
  });

  it("does not infer reverse XML association from an unmatched expected spelling", () => {
    const pairs = fixture();
    pairs.compiled!.jsonSchema = {
      registers: {
        renamed: {
          a: {
            to: "missing",
            category: "intentional",
            reason: "Expected renamed target",
          },
        },
      },
      plan: one("a"),
      source: one("a"),
    };
    pairs.xsd = {
      registers: {
        renamed: {
          Name: {
            to: "MissingElement",
            category: "intentional",
            reason: "Expected source element",
          },
        },
      },
      plan: one("Name"),
      source: one("Name"),
    };
    pairs.compiled!.xmlMapping = {
      plan: empty(),
      jsonSchema: { ...empty(), source: one("a") },
      xsd: { ...empty(), source: one("Name") },
    };
    const e = evaluatePairs(pairs),
      field = e.fields[0];
    expect(field.sources.form.path).toBeUndefined();
    expect(field.sources.xsd.path).toBeUndefined();
    expect(field.writtenPaths).toEqual([]);
    const orphans = e.findings.filter(
      (f) =>
        (f.check === "xmlMappingVsJsonSchema" ||
          f.check === "xmlMappingVsXsd") &&
        f.kind === "missing from plan",
    );
    expect(orphans).toHaveLength(2);
    expect(field.findings).not.toEqual(expect.arrayContaining(orphans));
    for (const orphan of orphans) expect(field.findings).not.toContain(orphan);
    expect(e.findings).toEqual(expect.arrayContaining(orphans));
  });

  it("retains every reverse-check finding when declared matches share one source", () => {
    const pairs = fixture();
    pairs.xsd = { registers: {}, plan: one("Name"), source: one("Name") };
    const renamed = Object.fromEntries(
      ["One", "Two", "Three"].map((path) => [
        path,
        {
          to: "Name",
          category: "intentional" as const,
          reason: "Declared shared coordinate",
        },
      ]),
    );
    pairs.compiled!.xmlMapping = {
      plan: empty(),
      jsonSchema: empty(),
      xsd: {
        registers: { renamed },
        plan: new Map(
          ["One", "Two", "Three"].map((path, order) => [
            path,
            { ...fact, order },
          ]),
        ),
        source: new Map([["Name", { ...fact, order: 0 }]]),
      },
    };
    const e = evaluatePairs(pairs);
    const order = e.findings.filter(
      (f) => f.check === "xmlMappingVsXsd" && f.dimension === "order",
    );
    expect(order).toHaveLength(2);
    expect(e.fields[0].findings).toEqual(expect.arrayContaining(order));
    expect(e.fields[0].outcomes.xmlMapping.form.findings).toEqual(
      expect.arrayContaining(order),
    );
  });

  it("retains occurrence evidence beyond displayed attributes", () => {
    const pairs = fixture();
    pairs.xsd = {
      registers: {
        differingRules: {
          "Name/maxOccurs": {
            category: "intentional",
            reason: "Explicit occurrence limit",
            plan: 1,
            source: 2,
          },
        },
      },
      plan: new Map([["Name", { ...fact, rules: { maxOccurs: 1 } }]]),
      source: new Map([["Name", { ...fact, rules: { maxOccurs: 2 } }]]),
    };
    const e = evaluatePairs(pairs);
    const occurrence = e.findings.find((f) => f.dimension === "maxOccurs")!;
    expect(e.fields[0].findings).toContain(occurrence);
    expect(occurrence).toMatchObject({
      status: "intentional",
      values: { plan: 1, source: 2 },
    });
    expect(projectComparison(e).findings).toContain(occurrence);
  });

  it("does not claim a UI label matches when the UI control is absent", () => {
    const pairs = fixture();
    pairs.compiled!.uiSchema.source.clear();
    const e = evaluatePairs(pairs),
      field = e.fields[0];
    expect(field.sources.form.path).toBe("a");
    for (const attribute of ["label", "help", "position"] as const) {
      expect(field.outcomes[attribute].form).toMatchObject({
        status: "notCompared",
        reason: "The UI schema has no control matching this field.",
      });
    }
    const missing = e.findings.find(
      (f) => f.check === "uiSchema" && f.kind === "missing from source",
    )!;
    expect(field.findings).toContain(missing);
    expect(field.outcomes.label.form.findings).toContain(missing);
    expect(
      projectComparison(e).fields[0].rows.find((r) => r.attribute === "label")
        ?.cells.form.status,
    ).toBe("notCompared");
  });

  it("distinguishes a missing XSD comparison from matching enum values", () => {
    const pairs = fixture({ ...name, xml_path: undefined });
    pairs.compiled!.schema.set("a", { ...fact, rules: { enum: ["A", "B"] } });
    const e = evaluatePairs(pairs);
    expect(e.fields[0].outcomes.options.form).toMatchObject({
      status: "notCompared",
      findings: [],
    });
    const row = projectComparison(e).fields[0].rows.find(
      (r) => r.attribute === "options",
    )!;
    expect(row.cells.form).toMatchObject({
      status: "notCompared",
      value: "2 values",
    });
  });

  it("returns resolved neighbors in matched source order", () => {
    const second = { ...name, label: "Second", json_path: "b", dat_field: "2" };
    const pairs: FormPairs = {
      plan: { slug: "order", children: [name, second] },
      planProblems: [],
      dat: {
        registers: {},
        plan: new Map([
          ["1", { ...fact, order: 0 }],
          ["2", { ...fact, order: 1 }],
        ]),
        source: new Map([
          ["1", { ...fact, order: 1 }],
          ["2", { ...fact, order: 0 }],
        ]),
      },
      xsd: empty(),
    };
    const e = evaluatePairs(pairs);
    expect(e.fields[0].sources.dat.position).toEqual({ before: "Second" });
    expect(e.fields[0].sources.dat.planPosition).toEqual({ after: "Second" });
    expect(e.fields[1].sources.dat.position).toEqual({ after: "Name" });
  });

  it("keeps tree-local ids, plan order and missing-implementation outcomes", () => {
    const noJson = { ...name, json_path: undefined };
    const plan: Plan = {
      slug: "tree",
      children: [name, { kind: "section", label: "Group", children: [noJson] }],
    };
    const e = evaluatePairs({
      plan,
      planProblems: [],
      dat: empty(),
      xsd: empty(),
    });
    expect(e.fields.map((f) => f.id)).toEqual(["a", "1.0"]);
    expect(e.fields[0].outcomes.label.form).toMatchObject({
      status: "notCompared",
      reason: "This form has no compiled spec to compare.",
    });
    expect(projectComparison(e).children).toEqual([
      { kind: "field", id: "a" },
      {
        kind: "section",
        section: { kind: "section", label: "Group" },
        children: [{ kind: "field", id: "1.0" }],
      },
    ]);
  });

  it("keeps source-only and bookkeeping evidence without inventing fields", () => {
    const e = evaluatePairs({
      plan: { slug: "empty", children: [] },
      planProblems: [{ kind: "required unreadable", path: "old" }],
      dat: {
        ...empty(),
        source: one("sourceOnly"),
        registers: {
          absentFromSource: {
            obsolete: { category: "gap", reason: "Old exception" },
          },
        },
      },
      xsd: empty(),
    });
    expect(e.fields).toEqual([]);
    expect(e.findings.some((f) => f.path === "sourceOnly")).toBe(true);
    expect(e.findings.some((f) => f.status === "stale")).toBe(true);
    expect(projectComparison(e).findings).toEqual(e.findings);
  });
});
