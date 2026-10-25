import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  processFormSchema,
  shapeFormData,
} from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { beforeAll, describe, expect, it } from "vitest";

import { CANONICAL_DIR, loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

const uuid = (index: number) =>
  `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const first = uuid(1);
const second = uuid(2);

const research = {
  id: "phs-398-research-plan",
  required: "research_strategy",
  fields: [
    "introduction_to_application",
    "specific_aims",
    "research_strategy",
    "progress_report_publication_list",
    "vertebrate_animals",
    "select_agent_research",
    "multiple_pd_pi_leadership_plan",
    "consortium_contractual_arrangements",
    "letters_of_support",
    "resource_sharing_plans",
    "other_plans",
    "authentication_of_key_biological_and_or_chemical_resources",
    "appendix",
  ],
};
const training = {
  id: "phs-398-research-training-program-plan",
  required: "program_plan",
  fields: [
    "introduction_to_application",
    "program_plan",
    "responsible_conduct_of_research",
    "methods_for_enhancing_reproducibility",
    "multiple_pd_pi_leadership_plan",
    "progress_report",
    "participating_faculty_biosketches",
    "letters_of_support",
    "data_tables",
    "vertebrate_animals",
    "select_agent_research",
    "consortium_contractual_arrangements",
    "other_plans",
    "appendix",
  ],
};

type CompiledIndex = {
  fieldOccurrences: { path: string; leaf: boolean; blockIds: string[] }[];
};
const loadIndex = async (id: string): Promise<CompiledIndex> =>
  JSON.parse(
    await readFile(path.join(CANONICAL_DIR, "forms", id, "index.json"), "utf8"),
  );

// These are compiled capture/consumer checks. External applicability and file-content
// services are deliberately not simulated, and no XML/submission gate is asserted here.
describe.each([research, training])("$id compiled document answers", (form) => {
  let spec: FormSpec;
  let index: CompiledIndex;
  beforeAll(async () => {
    [spec, index] = await Promise.all([
      loadFormSpec(form.id),
      loadIndex(form.id),
    ]);
  });

  it("validates all three authored examples, including full coverage and ten Appendix files", () => {
    const examples = (spec.schema as { examples?: Record<string, unknown>[] })
      .examples;
    expect(examples).toHaveLength(3);
    const validate = createAjv().compile(spec.schema);
    for (const example of examples ?? [])
      expect(validate(example), JSON.stringify(validate.errors)).toBe(true);
    expect(examples).toContainEqual({ [form.required]: expect.any(String) });
    expect(
      examples?.some((example) =>
        form.fields.every((field) => Object.hasOwn(example, field)),
      ),
    ).toBe(true);
    expect(
      examples?.some(
        (example) =>
          Array.isArray(example.appendix) && example.appendix.length === 10,
      ),
    ).toBe(true);
  });

  it("declares every named purpose at its own root path, with only the central plan statically required", () => {
    expect(Object.keys(spec.schema.properties ?? {})).toEqual(form.fields);
    expect(spec.schema.required).toEqual([form.required]);
    const leafPaths = index.fieldOccurrences
      .filter((occurrence) => occurrence.leaf)
      .map((occurrence) => occurrence.path)
      .sort();
    expect(leafPaths).toEqual(
      form.fields
        .map((field) => `/${field}${field === "appendix" ? "/[]" : ""}`)
        .sort(),
    );
    const validate = createAjv().compile(spec.schema);
    expect(validate({ [form.required]: first })).toBe(true);
    expect(validate({})).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        keyword: "required",
        params: { missingProperty: form.required },
      }),
    );
  });

  it("validates every singleton as one UUID, preserving optional absence rather than accepting empty or descriptor answers", () => {
    const validate = createAjv().compile(spec.schema);
    const minimum = { [form.required]: first };
    for (const field of form.fields.filter((field) => field !== "appendix")) {
      expect(validate({ ...minimum, [field]: second }), field).toBe(true);
      if (field !== form.required) {
        const absent = { ...minimum, [field]: second };
        delete absent[field];
        expect(validate(absent), `optional absence: ${field}`).toBe(true);
      }
      for (const bad of [
        null,
        "",
        "strategy.pdf",
        [],
        [second],
        { id: second },
        { file_name: "strategy.pdf", mime_type: "application/pdf" },
        1,
        false,
      ])
        expect(
          validate({ ...minimum, [field]: bad }),
          `${field}: ${JSON.stringify(bad)}`,
        ).toBe(false);
    }
  });

  it("allows omitted or empty Appendix and ten ordered IDs, while refusing 11, 100 and 101 files", () => {
    const validate = createAjv().compile(spec.schema);
    const minimum = { [form.required]: first };
    expect(validate(minimum)).toBe(true);
    for (const count of [0, 1, 10])
      expect(
        validate({ ...minimum, appendix: Array(count).fill(second) }),
        `appendix count ${count}`,
      ).toBe(true);
    for (const count of [11, 100, 101]) {
      expect(
        validate({ ...minimum, appendix: Array(count).fill(second) }),
        `appendix count ${count}`,
      ).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: "/appendix",
          keyword: "maxItems",
        }),
      );
    }
    for (const bad of [null, "", second, {}, [null], [""], [{ id: second }]])
      expect(validate({ ...minimum, appendix: bad }), JSON.stringify(bad)).toBe(
        false,
      );
  });

  it("collects distinct document values and preserves Appendix order while editing or deleting a sibling", () => {
    const { formSchema } = processFormSchema(spec.schema);
    const values = new FormData();
    const expected: Record<string, unknown> = {};
    const singletons = form.fields.filter((field) => field !== "appendix");
    singletons.forEach((field, index) => {
      values.set(field, uuid(index + 100));
      expected[field] = uuid(index + 100);
    });
    values.set("appendix[0]", uuid(300));
    values.set("appendix[1]", uuid(200));
    values.set("appendix[2]", uuid(400));
    expected.appendix = [uuid(300), uuid(200), uuid(400)];
    expect(shapeFormData(values, formSchema)).toEqual(expected);

    values.set("letters_of_support", uuid(500));
    expected.letters_of_support = uuid(500);
    expect(shapeFormData(values, formSchema)).toEqual(expected);

    values.set("appendix[0]", uuid(400));
    values.set("appendix[2]", uuid(300));
    expected.appendix = [uuid(400), uuid(200), uuid(300)];
    expect(shapeFormData(values, formSchema)).toEqual(expected);

    values.delete("introduction_to_application");
    delete expected.introduction_to_application;
    expect(shapeFormData(values, formSchema)).toEqual(expected);
    expect(createAjv().compile(spec.schema)(expected)).toBe(true);
  });
});

describe("Research and Training semantic reuse boundaries", () => {
  it("links exactly seven matching document purposes to the same compiled question-bank blocks", async () => {
    const [researchIndex, trainingIndex] = await Promise.all([
      loadIndex(research.id),
      loadIndex(training.id),
    ]);
    const shared = {
      introduction_to_application: "research/introduction-to-application",
      multiple_pd_pi_leadership_plan: "research/multiple-pd-pi-leadership-plan",
      vertebrate_animals: "research/vertebrate-animals",
      select_agent_research: "research/select-agent-research",
      consortium_contractual_arrangements:
        "research/consortium-contractual-arrangements",
      letters_of_support: "research/letters-of-support",
      other_plans: "research/other-plans",
    };
    for (const compiled of [researchIndex, trainingIndex]) {
      const semanticOccurrences = compiled.fieldOccurrences.filter(
        (occurrence) =>
          occurrence.leaf &&
          occurrence.blockIds.some((id) => id.startsWith("research/")),
      );
      expect(semanticOccurrences).toHaveLength(7);
      for (const [field, block] of Object.entries(shared))
        expect(
          compiled.fieldOccurrences.find(
            (occurrence) => occurrence.path === `/${field}` && occurrence.leaf,
          )?.blockIds,
          field,
        ).toEqual([block, "types/attachment"]);
    }
  });

  it("keeps Training Progress Report and faculty collections distinct from publication lists and individual-person sketches", async () => {
    const [researchSpec, trainingSpec, trainingIndex] = await Promise.all([
      loadFormSpec(research.id),
      loadFormSpec(training.id),
      loadIndex(training.id),
    ]);
    expect(researchSpec.schema.properties).toHaveProperty(
      "progress_report_publication_list",
    );
    expect(researchSpec.schema.properties).not.toHaveProperty(
      "progress_report",
    );
    expect(trainingSpec.schema.properties).toHaveProperty("progress_report");
    expect(trainingSpec.schema.properties).not.toHaveProperty(
      "progress_report_publication_list",
    );
    for (const field of [
      "progress_report",
      "participating_faculty_biosketches",
    ])
      expect(
        trainingIndex.fieldOccurrences.find(
          (occurrence) => occurrence.path === `/${field}`,
        )?.blockIds,
      ).toEqual(["types/attachment"]);
    expect(
      processFormSchema(trainingSpec.schema).formSchema.properties
        ?.participating_faculty_biosketches,
    ).toMatchObject({ type: "string", format: "uuid" });
    expect(trainingSpec.schema.properties).not.toHaveProperty(
      "biographical_sketch",
    );
  });
});
