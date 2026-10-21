import { describe, expect, it, vi } from "vitest";
import * as kernel from "./compare.ts";
import { evaluateCheck } from "./evaluate.ts";
import { evaluatePairs, formCheck, type FormPairs } from "./index.ts";
import { projectComparison } from "../comparison.ts";
import type { Plan } from "./flatten/plan.ts";

const field = { rules: {} };
const empty = () => ({ registers: {}, plan: new Map(), source: new Map() });
const plan = {
  slug: "synthetic",
  title: "Synthetic plan",
  children: [],
} as Plan;

describe("completed comparison evidence", () => {
  it("keeps missing/extra polarity and anchors in their original artifact coordinates", () => {
    const check = evaluateCheck(
      "jsonSchema",
      {
        registers: {},
        plan: new Map([["expected", field]]),
        source: new Map([["orphan", field]]),
      },
      { subject: "source" },
    );
    expect(check.result.missingFields.map((d) => d.path)).toEqual(["expected"]);
    expect(check.result.extraFields.map((d) => d.path)).toEqual(["orphan"]);
    expect(check.findings.find((d) => d.path === "expected")?.anchors).toEqual([
      { artifact: "plan", path: "expected" },
    ]);
    expect(check.findings.find((d) => d.path === "orphan")?.anchors).toEqual([
      { artifact: "jsonSchema", path: "orphan" },
    ]);
  });

  it("retains an accepted occurrence difference even though the table has no occurrence row", () => {
    const check = evaluateCheck(
      "xsd",
      {
        registers: {
          differingRules: {
            "people[]/maxOccurs": {
              category: "intentional",
              reason: "Explicit source-specific limit",
              plan: 1,
              source: 2,
            },
          },
        },
        plan: new Map([["people[]", { rules: { maxOccurs: 1 } }]]),
        source: new Map([["people[]", { rules: { maxOccurs: 2 } }]]),
      },
      { subject: "plan", occurrences: "equal" },
    );
    expect(check.coverage.has("maxOccurs")).toBe(true);
    expect(check.findings).toHaveLength(1);
    expect(check.findings[0]).toMatchObject({
      dimension: "maxOccurs",
      status: "intentional",
      values: { plan: 1, source: 2 },
      entry: { reason: "Explicit source-specific limit" },
    });
  });

  it("keeps stale register locations without inventing a data field", () => {
    const check = evaluateCheck(
      "dat",
      {
        ...empty(),
        registers: {
          absentFromSource: {
            obsolete: { category: "gap", reason: "Old exception" },
          },
        },
      },
      { subject: "plan" },
    );
    expect(check.findings[0]).toMatchObject({
      status: "stale",
      dimension: "record",
      anchors: [{ artifact: "differenceRecord", path: "obsolete" }],
    });
  });

  it("preserves valid rename metadata without inventing a new discrepancy", () => {
    const rename = {
      to: "person.name",
      category: "intentional" as const,
      reason: "Concept naming",
    };
    const check = evaluateCheck(
      "jsonSchema",
      {
        registers: { renamed: { paperName: rename } },
        plan: new Map([["paperName", field]]),
        source: new Map([["person.name", field]]),
      },
      { subject: "source" },
    );
    expect(check.findings).toEqual([]);
    expect(check.matched.get("paperName")).toBe("person.name");
    expect(check.renames.paperName).toEqual(rename);
  });

  it("keeps a source-only finding even when its spelling collides with a renamed plan field", () => {
    const renamedPlan = {
      ...plan,
      children: [{ kind: "field", label: "Name", json_path: "a" }],
    } as Plan;
    const evaluation = evaluatePairs({
      plan: renamedPlan,
      planProblems: [],
      dat: empty(),
      xsd: empty(),
      compiled: {
        schema: new Map([
          ["a", field],
          ["b", field],
        ]),
        indexLeaves: new Set(["a", "b"]),
        jsonSchema: {
          registers: {
            renamed: {
              a: { to: "b", category: "intentional", reason: "Concept name" },
            },
          },
          plan: new Map([["a", field]]),
          source: new Map([
            ["a", field],
            ["b", field],
          ]),
        },
        uiSchema: empty(),
        jsonSchemaVsXsd: empty(),
      },
    });
    const view = projectComparison(evaluation);
    expect(
      view.fields[0].rows.find((row) => row.attribute === "matchedBy")?.cells
        .form.value,
    ).toBe("b");
    expect(view.findings).toContainEqual(
      expect.objectContaining({
        check: "jsonSchema",
        kind: "missing from plan",
        anchors: [{ artifact: "jsonSchema", path: "a" }],
      }),
    );
  });

  it("anchors joined comparisons to real source coordinates without changing pin keys", () => {
    const check = evaluateCheck(
      "jsonSchemaVsXsd",
      {
        registers: {},
        plan: new Map([["person.name", { rules: { maxLength: 35 } }]]),
        source: new Map([["person.name", { rules: { maxLength: 20 } }]]),
      },
      {
        subject: "plan",
        constraints: { keywords: ["maxLength"], mode: "equal" },
      },
      new Map([["person.name", "Contact/FirstName"]]),
    );
    expect(check.findings[0]).toMatchObject({
      path: "person.name",
      values: { plan: 35, source: 20 },
      recordAs: { key: "person.name/maxLength" },
      anchors: [
        { artifact: "jsonSchema", path: "person.name" },
        { artifact: "xsd", path: "Contact/FirstName" },
      ],
    });
  });

  it("distinguishes empty findings from an unperformed check", () => {
    const check = evaluateCheck("dat", empty(), {
      subject: "plan",
      labels: true,
    });
    expect(check.findings).toEqual([]);
    expect(check.coverage.has("label")).toBe(true);
    expect(check.coverage.has("help")).toBe(false);
    expect(check.coverage.has("required")).toBe(false);
  });

  it("runs each check once and lets both projections reuse the completed evaluation", () => {
    const spy = vi.spyOn(kernel, "comparePair");
    try {
      const evaluation = evaluatePairs({
        plan,
        planProblems: [{ kind: "unreadable rule", path: "field" }],
        dat: empty(),
        xsd: empty(),
      });
      expect(spy).toHaveBeenCalledTimes(2);
      const legacy = formCheck(evaluation);
      const view = projectComparison(evaluation);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(legacy.implementation).toBeUndefined();
      expect(view.findings).toEqual(evaluation.findings);
      expect(view.findings[0].anchors).toEqual([
        { artifact: "plan", path: "field" },
      ]);
      expect(JSON.parse(JSON.stringify(view))).toEqual(view);
    } finally {
      spy.mockRestore();
    }
  });

  it("reuses all eight completed checks without rerunning them for either view", () => {
    const spy = vi.spyOn(kernel, "comparePair");
    try {
      const evaluation = evaluatePairs({
        plan,
        planProblems: [],
        dat: empty(),
        xsd: empty(),
        compiled: {
          schema: new Map(),
          indexLeaves: new Set(),
          jsonSchema: empty(),
          uiSchema: empty(),
          jsonSchemaVsXsd: empty(),
          xmlMapping: { plan: empty(), jsonSchema: empty(), xsd: empty() },
        },
      });
      expect(spy).toHaveBeenCalledTimes(8);
      expect(Object.keys(evaluation.checks)).toHaveLength(8);
      formCheck(evaluation);
      projectComparison(evaluation);
      expect(spy).toHaveBeenCalledTimes(8);
    } finally {
      spy.mockRestore();
    }
  });

  it("exposes index-only suite failures alongside ordinary findings", () => {
    const evaluation = evaluatePairs({
      plan,
      planProblems: [],
      dat: empty(),
      xsd: empty(),
      compiled: {
        schema: new Map([["unindexed", field]]),
        indexLeaves: new Set(["unrecognized"]),
        jsonSchema: empty(),
        uiSchema: empty(),
        jsonSchemaVsXsd: empty(),
      },
    } satisfies FormPairs);
    expect(projectComparison(evaluation).findings).toContainEqual(
      expect.objectContaining({
        check: "index",
        status: "unrecorded",
        kind: "index leaf missing from schema",
        anchors: [{ artifact: "index", path: "unrecognized" }],
      }),
    );
    expect(projectComparison(evaluation).findings).toContainEqual(
      expect.objectContaining({
        check: "index",
        kind: "schema leaf missing from index",
        anchors: [{ artifact: "jsonSchema", path: "unindexed" }],
      }),
    );
    expect(formCheck(evaluation).suite.indexProblems).toEqual(
      evaluation.suite.indexProblems,
    );
  });
});
