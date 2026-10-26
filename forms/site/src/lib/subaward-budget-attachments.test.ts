import {
  processFormSchema,
  shapeFormData,
} from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import {
  hasXmlTransform,
  loadPlans,
  readSource,
} from "../../../parity/harness/load.ts";
import { loadFormSpec } from "./formSpec";
import { createAjv } from "./validation";

const forms = [
  {
    slug: "r-r-subaward-budget-attachment-s-form",
    fid: 776,
    maximum: 10,
    instructions: ["0-3", "0-5"],
    extraction: "0-4",
  },
  {
    slug: "r-r-subaward-budget-attachment-s-form-10-yr-10-att",
    fid: 778,
    maximum: 10,
    instructions: ["0-3", "0-5"],
    extraction: "0-4",
  },
  {
    slug: "r-r-subaward-budget-attachment-s-form-10-yr-30-att",
    fid: 780,
    maximum: 30,
    instructions: ["0-3", "0-5"],
    extraction: "0-4",
  },
  {
    slug: "r-r-subaward-budget-attachment-s-form-5-yr-30-att",
    fid: 782,
    maximum: 30,
    instructions: ["0-3", "0-5"],
    extraction: "0-4",
  },
  {
    slug: "r-r-multi-project-subaward-budget-attachment-s-form-10yr-30att",
    fid: 789,
    maximum: 30,
    instructions: ["0-3", "0-5"],
    extraction: "0-4",
  },
  {
    slug: "research-related-subaward-budget-total-fed-non-fed-attachment-s-form",
    fid: 715,
    maximum: 10,
    instructions: ["0-4", "0-6"],
    extraction: "0-5",
  },
  {
    slug: "phs-398-training-subaward-budget-attachment-s-form",
    fid: 732,
    maximum: 30,
    instructions: ["1-0", "3-0"],
    extraction: "2-0",
  },
];
const first = "00000000-0000-4000-8000-000000000001";
const second = "00000000-0000-4000-8000-000000000002";
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
const strings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : value && typeof value === "object"
      ? Object.values(value).flatMap(strings)
      : [];

describe.each(forms)(
  "$slug source-qualified file capture",
  ({ slug, fid, maximum, instructions, extraction }) => {
    it("accepts optional zero through source capacity without inventing a required first file", async () => {
      const { schema } = await loadFormSpec(slug);
      const validate = createAjv().compile(schema);
      expect(Object.keys(schema.properties ?? {})).toEqual(["attachments"]);
      for (const value of [
        {},
        { attachments: [] },
        { attachments: [first] },
        { attachments: Array(maximum).fill(first) },
      ])
        expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
      expect(validate({ attachments: Array(maximum + 1).fill(first) })).toBe(
        false,
      );
    });

    it("rejects invalid reference shapes without pretending to validate PDF bytes or metadata", async () => {
      const { schema } = await loadFormSpec(slug);
      const validate = createAjv().compile(schema);
      for (const value of [
        null,
        first,
        [null],
        [""],
        ["not-a-uuid"],
        [{ id: first, filename: "budget.pdf" }],
        [{ attachment: first }],
      ])
        expect(validate({ attachments: value }), JSON.stringify(value)).toBe(
          false,
        );
    });

    it("validates every actual emitted example and selects examples by content rather than annotation order", async () => {
      const { schema } = await loadFormSpec(slug);
      const examples =
        (schema as { examples?: Record<string, unknown>[] }).examples ?? [];
      expect(examples).toHaveLength(2);
      expect(
        examples.some((example) => !Object.hasOwn(example, "attachments")),
      ).toBe(true);
      expect(
        examples.some(
          (example) =>
            Array.isArray(example.attachments) &&
            example.attachments.length === 2,
        ),
      ).toBe(true);
      const validate = createAjv().compile(schema);
      for (const example of examples)
        expect(validate(example), JSON.stringify(validate.errors)).toBe(true);
    });

    it("retains actual collector order and removes one reference without a wrapper or descriptor", async () => {
      const { schema } = await loadFormSpec(slug);
      const { formSchema } = processFormSchema(schema);
      const values = new FormData();
      values.set("attachments[0]", second);
      values.set("attachments[1]", first);
      expect(shapeFormData(values, formSchema)).toEqual({
        attachments: [second, first],
      });
      values.delete("attachments[1]");
      expect(shapeFormData(values, formSchema)).toEqual({
        attachments: [second],
      });
    });

    it("preserves complete original instructions, important warnings and extraction wording in plan and compiled UI", async () => {
      const plan = loadPlans().get(slug)!;
      const workbook = XLSX.read(readSource(plan.dat_url!));
      const rows = XLSX.utils.sheet_to_json<unknown[]>(
        workbook.Sheets["Form DAT"],
        { header: 1, defval: null },
      );
      const original = [...instructions, extraction].map((id) => {
        const row = rows.find((row) => row[0] === id);
        expect(row, `original DAT row ${id}`).toBeDefined();
        expect(typeof row![1]).toBe("string");
        return normalize(row![1] as string);
      });
      if (fid === 732) {
        const burden = rows.find((row) => row[0] === "0-0");
        expect(typeof burden![16]).toBe("string");
        original.push(normalize(burden![16] as string));
      }
      const { uischema } = await loadFormSpec(slug);
      for (const display of [
        normalize(strings(plan.children).join("\n")),
        normalize(strings(uischema).join("\n")),
      ]) {
        for (const paragraph of original) expect(display).toContain(paragraph);
        const removed = display.split(original[0]).join("");
        expect(removed.includes(original[0])).toBe(false);
      }
    });

    it("leaves XML generation inactive instead of serializing attachment IDs as source payloads", () => {
      expect(hasXmlTransform(slug)).toBe(false);
    });
  },
);
