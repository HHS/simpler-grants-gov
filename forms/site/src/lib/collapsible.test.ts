import type { UISchemaElement } from "@jsonforms/core";
import { describe, expect, it } from "vitest";

import {
  displayValue,
  entryFields,
  entryLayout,
  entryTitle,
  previewText,
  scopePath,
  summaryRows,
  summarySections,
  type EntryNode,
} from "./collapsible";

describe("scopePath", () => {
  it("reads the property names out of a scope", () => {
    expect(scopePath("#/properties/name/properties/first_name")).toEqual([
      "name",
      "first_name",
    ]);
  });
});

describe("entryLayout", () => {
  const field = (...storagePath: string[]) => ({ storagePath });
  const ROLE = field("project_role");
  const FIRST = field("name", "first_name");
  const LAST = field("name", "last_name");
  const EXTRA = field("extra");
  const FIELDS = [ROLE, FIRST, LAST, EXTRA];

  const DETAIL = {
    type: "VerticalLayout",
    elements: [
      { type: "Control", scope: "#/properties/project_role" },
      {
        type: "Group",
        label: "Name",
        elements: [
          { type: "Control", scope: "#/properties/name/properties/first_name" },
          { type: "Control", scope: "#/properties/name/properties/last_name" },
        ],
      },
    ],
  } as UISchemaElement;

  const shape = (nodes: EntryNode<{ storagePath: string[] }>[]): unknown[] =>
    nodes.map((node) =>
      node.kind === "field"
        ? node.field.storagePath.join(".")
        : { [node.label]: shape(node.children) },
    );

  it("keeps each group's fields under it, in the detail's order", () => {
    expect(shape(entryLayout(DETAIL, FIELDS))).toEqual([
      "project_role",
      { Name: ["name.first_name", "name.last_name"] },
      "extra",
    ]);
  });

  it("gives a control every field stored beneath its path", () => {
    const objectControl = {
      type: "VerticalLayout",
      elements: [{ type: "Control", scope: "#/properties/name" }],
    } as UISchemaElement;
    expect(shape(entryLayout(objectControl, FIELDS))).toEqual([
      "name.first_name",
      "name.last_name",
      "project_role",
      "extra",
    ]);
  });

  it("does not head the entry with the detail's own group", () => {
    const wrapped = {
      type: "Group",
      label: "Key Contact",
      elements: [
        { type: "Control", scope: "#/properties/project_role" },
        {
          type: "Group",
          label: "Name",
          elements: [{ type: "Control", scope: "#/properties/name" }],
        },
      ],
    } as UISchemaElement;
    expect(shape(entryLayout(wrapped, FIELDS))).toEqual([
      "project_role",
      { Name: ["name.first_name", "name.last_name"] },
      "extra",
    ]);
  });

  it("lists every field in order without a detail", () => {
    expect(entryFields(entryLayout(undefined, FIELDS))).toEqual(FIELDS);
  });
});

describe("summarySections", () => {
  const field = (...storagePath: string[]) => ({ storagePath });
  const NODES: EntryNode<{ storagePath: string[] }>[] = [
    { kind: "field", field: field("project_role") },
    { kind: "field", field: field("title") },
    {
      kind: "group",
      label: "Name",
      children: [
        { kind: "field", field: field("name", "first_name") },
        { kind: "field", field: field("name", "last_name") },
      ],
    },
    { kind: "field", field: field("email") },
  ];

  it("lists ungrouped fields in runs and each group under its label", () => {
    expect(summarySections(NODES, (f) => f.storagePath.join("."))).toEqual([
      { items: ["project_role", "title"] },
      { label: "Name", items: ["name.first_name", "name.last_name"] },
      { items: ["email"] },
    ]);
  });
});

describe("displayValue", () => {
  it.each([
    [{ value: "Doe" }, "Doe"],
    [{ value: "" }, undefined],
    [{ value: true }, "Yes"],
    [
      { value: "USA", enumOptions: [{ value: "USA", label: "United States" }] },
      "United States",
    ],
    [{ value: "f1", attachment: true }, "1 file"],
    [{ value: ["f1", "f2"], attachment: true }, "2 files"],
  ])("reads %j as %s", (item, expected) => {
    expect(displayValue({ label: "x", required: false, ...item })).toBe(
      expected,
    );
  });
});

describe("summaryRows", () => {
  it("marks blanks, and required blanks as missing", () => {
    expect(
      summaryRows([
        { label: "First Name", value: "Jane", required: true },
        { label: "Suffix", value: "", required: false },
        { label: "Email", value: undefined, required: true },
      ]),
    ).toEqual([
      { label: "First Name", value: "Jane", status: "filled" },
      { label: "Suffix", value: "—", status: "blank" },
      { label: "Email", value: "Missing", status: "missing" },
    ]);
  });
});

describe("entryTitle", () => {
  const item = (storagePath: string[], value: unknown) => ({
    label: storagePath.join("."),
    value,
    required: false,
    storagePath,
  });

  it("names an entry by its name group", () => {
    expect(
      entryTitle(
        [
          item(["project_role"], "PI"),
          item(["name", "prefix"], "Dr."),
          item(["name", "first_name"], "Ana"),
          item(["name", "last_name"], "Ruiz"),
        ],
        "Contact 1",
      ),
    ).toBe("Dr. Ana Ruiz");
  });

  it("keeps a source-valid long answer out of the entry heading without altering it", () => {
    const answer = "A".repeat(4000);
    const fields = [item(["citation"], answer)];
    const title = entryTitle(fields, "Study 1");
    expect(Array.from(title).length).toBeLessThanOrEqual(80);
    expect(title.endsWith("…")).toBe(true);
    expect(fields[0].value).toBe(answer);
  });

  it("falls back to the first answer, then the number", () => {
    expect(entryTitle([item(["project_role"], "PI")], "Contact 1")).toBe("PI");
    expect(entryTitle([item(["project_role"], "")], "Contact 1")).toBe(
      "Contact 1",
    );
  });
});

describe("previewText", () => {
  it("preserves short values and exact boundaries", () => {
    expect(previewText("x".repeat(80), 80)).toBe("x".repeat(80));
    expect(previewText("Short", 80)).toBe("Short");
  });

  it("does not split a Unicode surrogate pair in an excerpt", () => {
    expect(previewText("😀".repeat(81), 80)).toBe("😀".repeat(79) + "…");
  });
});
