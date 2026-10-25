import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import {
  loadFormSchema,
  loadPlans,
  loadUiSchema,
  readSource,
} from "./harness/load.ts";

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
const strings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];

for (const [slug, clauses] of [
  ["assurances-for-non-construction-programs-sf-424b", 19],
  ["assurances-for-construction-programs-sf-424d", 20],
] as const) {
  describe(slug, () => {
    const plan = loadPlans().get(slug)!;
    const book = XLSX.read(readSource(plan.dat_url!));
    const rows = XLSX.utils.sheet_to_json<unknown[]>(book.Sheets["Form DAT"], {
      header: 1,
      defval: "",
    });
    // These originals put the opening in00-3..00-7 and each numbered assurance
    // in a separate label row. Read the source text, not a copied golden body.
    const opening = ["00-3", "00-4", "00-5", "00-6", "00-7"].map((id) => {
      const row = rows.find((row) => row[0] === id);
      if (!row || typeof row[1] !== "string")
        throw new Error(`Missing DAT ${id}`);
      return row[1];
    });
    const numbered = rows.filter((row) => /^\d+\./.test(String(row[1])));
    const body = normalize(
      [...opening, ...numbered.map((row) => String(row[1]))].join("\n\n"),
    );

    it("preserves every original assurance paragraph in plan and compiled UI content", () => {
      expect(
        numbered.map((row) => Number(/^(\d+)\./.exec(String(row[1]))![1])),
      ).toEqual(Array.from({ length: clauses }, (_, i) => i + 1));
      expect(normalize(strings(plan.children).join("\n\n"))).toContain(body);
      expect(normalize(strings(loadUiSchema(slug)).join("\n\n"))).toContain(
        body,
      );
    });

    it("keeps the existing four-answer API draft contract and service context", async () => {
      const schema = await loadFormSchema(slug);
      expect(Object.keys(schema.properties as object).sort()).toEqual([
        "applicant_organization",
        "date_signed",
        "signature",
        "title",
      ]);
      expect([...(schema.required as string[])].sort()).toEqual([
        "applicant_organization",
        "title",
      ]);
      const properties = schema.properties as Record<
        string,
        { readOnly?: boolean }
      >;
      expect(properties.signature.readOnly).toBe(true);
      expect(properties.date_signed.readOnly).toBe(true);
      expect(properties.title.readOnly).not.toBe(true);
      expect(properties.applicant_organization.readOnly).not.toBe(true);
    });
  });
}
