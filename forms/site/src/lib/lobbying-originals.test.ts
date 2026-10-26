import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import {
  loadFormSchema,
  loadPlans,
  loadUiSchema,
  readSource,
} from "../../../parity/harness/load.ts";
import { createAjv } from "./validation";

const originals = [
  {
    slug: "grants-gov-lobbying-form",
    rows: ["0-2", "0-3", "1-0", "2-0", "3-0", "4-0", "4-1", "4-2"],
    paths: [
      "organization_name",
      "authorized_representative_name",
      "authorized_representative_title",
      "authorized_representative_signature",
      "submitted_date",
    ],
  },
  {
    slug: "cd511-form",
    rows: [
      "00-05",
      "01-00",
      "01-02",
      "01-04",
      "01-07",
      "01-08",
      "01-09",
      "01-01",
      "01-03",
      "01-05",
      "01-06",
      "01-10",
    ],
    paths: [
      "applicant_name",
      "award_number",
      "project_name",
      "contact_person",
      "contact_person_title",
      "signature",
      "submitted_date",
    ],
  },
];
const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
const strings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : value && typeof value === "object"
      ? Object.values(value).flatMap(strings)
      : [];

for (const { slug, rows, paths } of originals)
  describe(slug, () => {
    it("retains the ordered source legal paragraphs in plan and compiled UI content", () => {
      const plan = loadPlans().get(slug)!;
      const book = XLSX.read(readSource(plan.dat_url!));
      const sheet = XLSX.utils.sheet_to_json<unknown[]>(
        book.Sheets["Form DAT"],
        { header: 1, defval: null },
      );
      const original = rows.map((id) => {
        const row = sheet.find((row) => row[0] === id);
        expect(row, `original DAT row ${id}`).toBeDefined();
        expect(typeof row![1]).toBe("string");
        return normalize(row![1] as string);
      });
      const body = normalize(original.join("\n\n"));
      expect(normalize(strings(plan.children).join("\n\n"))).toContain(body);
      const display = normalize(strings(loadUiSchema(slug)).join("\n"));
      expect(display).toContain(body);
      const missing = (text: string) =>
        original.filter((paragraph) => !text.includes(paragraph));
      expect(missing(display)).toEqual([]);
      // A local display mutation loses one actual source paragraph and must be detected.
      const changed = display.split(original[2]).join("");
      expect(missing(changed)).toContain(original[2]);
    });

    it("keeps the installed API root paths and validates each lifecycle example", async () => {
      const schema = await loadFormSchema(slug);
      expect(Object.keys(schema.properties as object).sort()).toEqual(
        [...paths].sort(),
      );
      const validate = createAjv().compile(schema);
      const plan = loadPlans().get(slug)!;
      const examples = (plan as typeof plan & { examples: { data: unknown }[] })
        .examples;
      for (const example of examples)
        expect(validate(example.data), JSON.stringify(validate.errors)).toBe(
          true,
        );
    });
  });

it("CD-511 allows either independent reference and both, while detecting an XOR mutation", async () => {
  const guidance = "Provide an award number, a project name, or both.";
  expect(strings(loadPlans().get("cd511-form")!.children).join("\n")).toContain(
    guidance,
  );
  expect(strings(loadUiSchema("cd511-form")).join("\n")).toContain(guidance);
  const schema = await loadFormSchema("cd511-form");
  const validate = createAjv().compile(schema);
  const base = {
    applicant_name: "Illustrative Applicant",
    contact_person: { first_name: "Avery", last_name: "Pine" },
    contact_person_title: "Director",
  };
  expect(validate({ ...base, award_number: "AWARD-ONLY" })).toBe(true);
  expect(validate({ ...base, project_name: "Project only" })).toBe(true);
  const both = {
    ...base,
    award_number: "DISTINCT-AWARD",
    project_name: "Distinct project",
  };
  expect(validate(both)).toBe(true);
  expect(validate(base)).toBe(false);
  expect(validate({ ...both, award_number: "" })).toBe(false);
  expect(validate({ ...both, project_name: "" })).toBe(false);
  const mutant = structuredClone(schema);
  let changed = false;
  function replaceChoice(node: Record<string, unknown>) {
    if (
      Array.isArray(node.anyOf) &&
      node.anyOf.length === 2 &&
      node.anyOf.every(
        (branch) =>
          typeof branch === "object" && branch !== null && "required" in branch,
      )
    ) {
      node.oneOf = node.anyOf;
      delete node.anyOf;
      changed = true;
      return;
    }
    for (const value of Object.values(node))
      if (value && typeof value === "object")
        replaceChoice(value as Record<string, unknown>);
  }
  replaceChoice(mutant);
  expect(changed).toBe(true);
  expect(createAjv().compile(mutant)(both)).toBe(false);
  expect(validate(both)).toBe(true);
});
