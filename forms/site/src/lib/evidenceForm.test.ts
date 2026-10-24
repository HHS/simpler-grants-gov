import {
  processFormSchema,
  shapeFormData,
} from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { beforeAll, describe, expect, it } from "vitest";

import { loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

const levels = [
  "Demonstrates a Rationale",
  "Promising Evidence",
  "Moderate Evidence",
  "Strong Evidence",
];
const study = (suffix: string) => ({
  citation: `Fictional study ${suffix}`,
  relevant_findings: `Distinct finding ${suffix}`,
  overlap_of_populations: `Distinct population ${suffix}`,
});

describe("ED Evidence source and actual collector contract", () => {
  let spec: FormSpec;
  beforeAll(async () => {
    spec = await loadFormSpec("evidence-form");
  });

  it.each(levels)("accepts source evidence level %s", (level) => {
    expect(
      createAjv().compile(spec.schema)({
        level_of_evidence: level,
        citations: [study("A")],
      }),
    ).toBe(true);
  });

  it("keeps 100 complete studies and rejects 101", () => {
    const validate = createAjv().compile(spec.schema);
    const data = {
      level_of_evidence: levels[0],
      citations: Array.from({ length: 100 }, (_, i) => study(String(i))),
    };
    expect(validate(data)).toBe(true);
    data.citations.push(study("101"));
    expect(validate(data)).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        keyword: "maxItems",
        instancePath: "/citations",
      }),
    );
  });

  it.each([
    ["unknown level", { level_of_evidence: "Strong", citations: [study("A")] }],
    ["missing level", { citations: [study("A")] }],
    ["empty studies", { level_of_evidence: levels[0], citations: [] }],
    [
      "missing study cell",
      {
        level_of_evidence: levels[0],
        citations: [{ citation: "A", relevant_findings: "B" }],
      },
    ],
    [
      "empty study cell",
      {
        level_of_evidence: levels[0],
        citations: [{ ...study("A"), citation: "" }],
      },
    ],
    [
      "4001-character cell",
      {
        level_of_evidence: levels[0],
        citations: [{ ...study("A"), citation: "x".repeat(4001) }],
      },
    ],
  ])("rejects %s", (_label, data) => {
    expect(createAjv().compile(spec.schema)(data)).toBe(false);
  });

  it("preserves two complete, distinct ordered studies through SGG's native FormData collector", () => {
    const data = {
      level_of_evidence: levels[1],
      citations: [study("A"), study("B")],
    };
    const native = new FormData();
    native.set("level_of_evidence", data.level_of_evidence);
    data.citations.forEach((row, index) => {
      for (const [key, value] of Object.entries(row))
        native.set(`citations[${index}]--${key}`, value);
    });
    const { formSchema } = processFormSchema(spec.schema);
    expect(shapeFormData(native, formSchema)).toEqual(data);
  });

  it("selects the existing library list for citations without changing their data shape", () => {
    const controls = (node: unknown): Record<string, unknown>[] => {
      if (Array.isArray(node)) return node.flatMap(controls);
      if (!node || typeof node !== "object") return [];
      const value = node as Record<string, unknown>;
      return [
        ...(typeof value.scope === "string" ? [value] : []),
        ...Object.values(value).flatMap(controls),
      ];
    };
    expect(
      controls(spec.uischema).find(
        (control) => control.scope === "#/properties/citations",
      ),
    ).toMatchObject({
      options: { widget: "CollapsibleFieldList" },
    });
    expect(spec.example?.citations).toBeInstanceOf(Array);
  });

  it("puts source level-dependent study guidance into the actual UI", () => {
    const text = JSON.stringify(spec.uischema);
    expect(text).toContain("Demonstrates a Rationale");
    expect(text).toContain("Promising, Moderate, and Strong Evidence");
    expect(text).toContain("populations and settings");
  });
});
