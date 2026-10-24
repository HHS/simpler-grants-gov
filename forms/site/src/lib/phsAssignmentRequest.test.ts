import { beforeAll, describe, expect, it } from "vitest";

import { loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

/** Exercise source obligations through the same generated schema the preview consumes. */
describe("PHS assignment request source contracts", () => {
  let spec: FormSpec;
  beforeAll(async () => {
    spec = await loadFormSpec("phs-assignment-request-form");
  });
  const valid = (data: unknown) => createAjv().compile(spec.schema)(data);

  it("has a populated default and validates every compiled example on declared paths", () => {
    expect(Object.keys(spec.example ?? {})).toHaveLength(13);
    const examples = (
      spec.schema as typeof spec.schema & {
        examples: Record<string, unknown>[];
      }
    ).examples;
    expect(examples).toHaveLength(3);
    const declared = new Set(Object.keys(spec.schema.properties ?? {}));
    for (const example of examples) {
      expect(valid(example)).toBe(true);
      expect(Object.keys(example).every((name) => declared.has(name))).toBe(
        true,
      );
    }
  });

  it("keeps source instructions and the burden statement in display groups, not answer fields", () => {
    const ui = JSON.stringify(spec.uischema);
    expect(ui).toContain("Components of Participating Organizations");
    expect(ui).toContain("Do not provide names of individuals");
    expect(ui).toContain("Public reporting burden");
    expect(ui).toContain("30 minutes per response");
    expect(spec.schema.properties).not.toHaveProperty("burdenStatement");
  });

  it("preserves independently optional fixed slots, including sparse gaps", () => {
    expect(valid({})).toBe(true);
    expect(
      valid({
        suggested_awarding_component1: "NCI",
        suggested_awarding_component3: "NHLBI",
      }),
    ).toBe(true);
    expect(spec.schema.properties).not.toHaveProperty("awardingComponents");
    expect(spec.schema.properties).not.toHaveProperty("studySections");
  });

  it.each([
    ["suggested_awarding_component1", 7],
    ["suggested_study_section1", 20],
    ["expertise1", 40],
    ["rationale_suggestions", 1000],
    ["not_review", 1000],
  ])(
    "preserves the %s length boundary and empty-value contract",
    (key, max) => {
      expect(valid({ [key]: "" })).toBe(true);
      expect(valid({ [key]: "A".repeat(max) })).toBe(true);
      expect(valid({ [key]: "A".repeat(max + 1) })).toBe(false);
      expect(valid({ [key]: null })).toBe(false);
      expect(valid({ [key]: 1 })).toBe(false);
    },
  );

  it.each(["BP (10)", "BP-10", "BP 10"])(
    "rejects the source-instructed study-code characters in %s without rewriting input",
    (code) => {
      const answer = { suggested_study_section1: code };
      expect(valid(answer)).toBe(false);
      expect(answer.suggested_study_section1).toBe(code);
    },
  );

  it.each(["AIRT", "B10", "BP10"])(
    "accepts the source examples lexically without claiming current-code eligibility: %s",
    (code) => expect(valid({ suggested_study_section1: code })).toBe(true),
  );
});
