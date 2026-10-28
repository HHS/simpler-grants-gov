import { beforeEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

import { compareForm } from "./comparison.ts";
import { formPairs, type Plan } from "./harness/index.ts";
import type { Json } from "./harness/model.ts";

// Exercise the public reader/compare pipeline without catalogue plans, emitted forms,
// a source cache, or future tranche files. Only the disk boundary is replaced.
const fixture = vi.hoisted(() => ({
  dat: Buffer.alloc(0),
  xsd: "",
  schema: {} as Json,
}));
vi.mock("./diffs/index.ts", () => ({
  DIFFS: [{ slug: "finite-source-fixture" }],
}));
vi.mock("./harness/load.ts", () => ({
  loadPlans: () => new Map(),
  readSource: (url: string) =>
    url.endsWith(".xls") ? fixture.dat : Buffer.from(fixture.xsd),
  loadFormSchema: async () => fixture.schema,
  loadUiSchema: () => ({ type: "Control", scope: "#/properties/types" }),
  loadIndex: () => ({ fieldOccurrences: [] }),
  loadXmlTransform: () => undefined,
  hasXmlTransform: () => false,
  loadGrantsGovIdentity: () => ({}),
}));
const slug = "finite-source-fixture";
const dat = (labels: string[]) => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      [
        "Field #",
        "Field Label",
        "Required?",
        "Data Type",
        "Max # of Chars or Max Value",
        "Maximum Occurrences",
        "Field Implementation",
        "Help Tip",
      ],
      ...labels.map((label, index) => [
        `A-${index + 1}-1`,
        label,
        "No",
        "AN",
        60,
        1,
        "Field",
        "",
      ]),
    ]),
    "Form DAT",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xls" });
};
const plan = (count: number): Plan => ({
  slug,
  dat_url: "https://example.test/source.xls",
  xsd_url: "https://example.test/source.xsd",
  children: [
    {
      kind: "field",
      label: "Activity title",
      required: false,
      json_path: "activities[].title",
      max_items: count,
      constraints: "maxLength 60",
      source_bindings: {
        at: "activities",
        dat: Array.from({ length: count }, (_, index) => ({
          kind: "slot",
          index,
          path: `A-${index + 1}-1`,
        })),
      },
    },
  ],
});
const xsd = (body: string) =>
  `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element name="Form"><xs:complexType><xs:sequence>${body}</xs:sequence></xs:complexType></xs:element></xs:schema>`;
beforeEach(() => {
  fixture.dat = dat(["Activity title"]);
  fixture.xsd = xsd("");
  fixture.schema = {};
});

describe("numbered source positions through the review pipeline", () => {
  it("shows all four DAT activity cells for one question, including a last-cell mismatch", async () => {
    fixture.dat = dat([
      "Activity title",
      "Activity title",
      "Activity title",
      "Wrong last label",
    ]);
    const compared = (await compareForm(plan(4)))!;
    expect(compared.fields).toHaveLength(1);
    const label = compared.fields[0].rows.find(
      (row) => row.attribute === "label",
    )!.cells.dat;
    expect(label.status).toBe("unrecorded");
    expect(label.value).toContain("A-4-1: Wrong last label");
    fixture.dat = dat(Array(4).fill("Activity title"));
    const corrected = (await compareForm(plan(4)))!;
    expect(
      corrected.fields[0].rows.find((row) => row.attribute === "label")!.cells
        .dat.status,
    ).toBe("match");
  });

  it("joins one min1/max3 answer to first-required/later-optional XML positions and refuses min2", async () => {
    fixture.xsd = xsd(
      [1, 2, 3]
        .map(
          (n) =>
            `<xs:element name="Type${n}" type="xs:string" minOccurs="${n === 1 ? 1 : 0}"/>`,
        )
        .join(""),
    );
    fixture.schema = {
      type: "object",
      required: ["types"],
      properties: {
        types: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: { type: "string" },
        },
      },
    };
    const p: Plan = {
      slug,
      spec_id: "inline-fixture",
      dat_url: "https://example.test/source.xls",
      xsd_url: "https://example.test/source.xsd",
      children: [
        {
          kind: "field",
          label: "Applicant types",
          json_path: "types[]",
          required: true,
          min_items: 1,
          max_items: 3,
          source_bindings: {
            at: "types",
            xml: [1, 2, 3].map((n, index) => ({
              kind: "slot",
              path: `Type${n}`,
              index,
            })),
          },
        },
      ],
    };
    const paired = await formPairs({ slug }, new Map([[slug, p]]));
    expect(
      paired.compiled?.jsonSchemaVsXsd.source.get("types[]"),
    ).toMatchObject({ required: "yes", rules: { maxOccurs: 3 } });
    p.children![0].min_items = 2;
    await expect(formPairs({ slug }, new Map([[slug, p]]))).rejects.toThrow(
      "Finite XML slots disagree",
    );
  });

  it("checks five revision-option controls against one linked enumeration and reports Z", async () => {
    fixture.xsd = xsd(
      `<xs:element name="RevisionCode"><xs:simpleType><xs:restriction base="xs:string">${["A", "B", "C", "D", "E"].map((code) => `<xs:enumeration value="${code}"/>`).join("")}</xs:restriction></xs:simpleType></xs:element>`,
    );
    const codes = ["A", "B", "C", "D", "E"];
    const p: Plan = {
      slug,
      dat_url: "https://example.test/source.xls",
      xsd_url: "https://example.test/source.xsd",
      children: [
        {
          kind: "field",
          label: "Revision reason",
          json_path: "revision_code",
          xml_path: "RevisionCode",
          required: false,
          source_bindings: {
            dat: codes.map((value, index) => ({
              kind: "choice",
              path: `08-1-${index + 1}`,
              value,
            })),
          },
        },
      ],
    };
    expect(
      (await formPairs({ slug }, new Map([[slug, p]]))).planProblems,
    ).toEqual([]);
    const field = p.children![0];
    if (
      field.kind !== "field" ||
      !field.source_bindings ||
      "at" in field.source_bindings
    )
      throw new Error("fixture");
    field.source_bindings.dat[4].value = "Z";
    expect(
      (await formPairs({ slug }, new Map([[slug, p]]))).planProblems,
    ).toContainEqual({
      kind: "choice code outside XSD",
      path: "08-1-5",
      detail: expect.any(String),
    });
  });
});
