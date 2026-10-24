import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import {
  FORMS_ROOT,
  loadFormSchema,
  loadGrantsGovIdentity,
  loadUiSchema,
  loadXmlTransform,
  readSource,
} from "../../../parity/harness/load.ts";
import { createAjv } from "./validation";

const FORMS = ["assurances-for-non-construction-programs-sf-424b-individual"];

const normalized = (text: string) => text.replace(/\s+/g, " ").trim();

/** Declared UI descriptions only: no invented applicant properties for static assurances. */
function descriptions(node: unknown): string[] {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(descriptions);
  return Object.entries(node).flatMap(([key, value]) =>
    key === "description" && typeof value === "string"
      ? [value]
      : descriptions(value),
  );
}

describe.each(FORMS)("$0 completion contract", (slug) => {
  let validate: ReturnType<ReturnType<typeof createAjv>["compile"]>;
  let examples: Record<string, unknown>[];
  let rootProperties: string[];
  beforeAll(async () => {
    const schema = await loadFormSchema(slug);
    // As in the preview: inline references are copied without repeated schema identities.
    const copied = JSON.parse(
      JSON.stringify(schema, (key, value) =>
        key === "$id" || key === "$schema" ? undefined : value,
      ),
    );
    rootProperties = Object.keys(copied.properties);
    validate = createAjv().compile(copied);
    examples = copied.examples;
  });

  it("validates both distinct completed-context examples", () => {
    expect(examples).toHaveLength(2);
    for (const example of examples)
      expect(validate(example), JSON.stringify(validate.errors)).toBe(true);
    expect(examples[0]).not.toEqual(examples[1]);
  });

  it("keeps version metadata outside applicant data and consistent with the registered edition", () => {
    expect(rootProperties.sort()).toEqual([
      "applicant_organization_name",
      "authorized_representative",
      "submitted_date",
    ]);
    const identity = loadGrantsGovIdentity(slug) as { formVersion: string };
    const mapping = loadXmlTransform(slug)!;
    expect(mapping._xml_config.xml_structure.root_attributes.FormVersion).toBe(
      identity.formVersion,
    );
    const initialized = Object.values(mapping).flatMap((value) => {
      const rule =
        value && typeof value === "object" ? value.xml_transform : undefined;
      return rule && Object.hasOwn(rule, "static_value") ? [rule] : [];
    });
    expect(initialized).toHaveLength(0);
  });

  it("requires every DAT completion value instead of weakening to the optional wire schema", () => {
    for (const [group, name] of [
      ["authorized_representative", "signature"],
      ["authorized_representative", "title"],
      [null, "applicant_organization_name"],
      [null, "submitted_date"],
    ] as const) {
      const absent = structuredClone(examples[0]);
      if (group) delete (absent[group] as Record<string, unknown>)[name];
      else delete absent[name];
      expect(validate(absent), name).toBe(false);
    }
  });

  it("rejects empty or overlong signature, title and applicant-name values", () => {
    for (const [group, name, limit] of [
      ["authorized_representative", "signature", 144],
      ["authorized_representative", "title", 45],
      [null, "applicant_organization_name", 60],
    ] as const) {
      for (const invalid of ["", "x".repeat(limit + 1)]) {
        const value = structuredClone(examples[0]);
        if (group) (value[group] as Record<string, unknown>)[name] = invalid;
        else value[name] = invalid;
        expect(validate(value), `${name}: length${invalid.length}`).toBe(false);
      }
    }
  });

  it("rejects impossible or non-ISO submitted dates", () => {
    for (const invalid of ["2026-02-30", "10/24/2026", ""]) {
      expect(
        validate({ ...examples[0], submitted_date: invalid }),
        invalid,
      ).toBe(false);
    }
  });

  it("keeps every source declaration clause and distinguishes the two burden statements", () => {
    const plan = JSON.parse(
      readFileSync(
        path.join(FORMS_ROOT, "site/src/content/forms", `${slug}.json`),
        "utf8",
      ),
    );
    const book = XLSX.read(readSource(plan.dat_url), { type: "buffer" });
    const rows = book.SheetNames.flatMap((name) =>
      XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[name], {
        header: 1,
        defval: "",
      }),
    );
    const clauses = rows
      .filter((row) => /^\d+\.\s/.test(String(row[1] ?? "").trim()))
      .map((row) => normalized(String(row[1])));
    expect(clauses.length).toBeGreaterThanOrEqual(19);
    const rendered = normalized(descriptions(loadUiSchema(slug)).join("\n"));
    let position = -1;
    for (const clause of clauses) {
      const next = rendered.indexOf(clause);
      expect(next, clause).toBeGreaterThan(position);
      position = next;
    }
    expect(rendered).toContain("Printed form burden statement");
    expect(rendered).toContain("Detailed burden statement from the DAT");
    expect(rendered).toContain("15 minutes");
    const popup = rows.find(
      (row) => String(row[2] ?? "").trim() === "Burden Statement Button",
    );
    const popupMinutes = /average\s+(\d+)\s+minutes/.exec(
      String(popup?.[10] ?? ""),
    )?.[1];
    expect(popupMinutes).toBeDefined();
    expect(rendered).toContain(`${popupMinutes} minutes`);
    expect(rendered).not.toContain("Clicking displays burden statement:");
  });
});
