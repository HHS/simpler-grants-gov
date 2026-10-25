import { describe, expect, it } from "vitest";

import {
  AmbiguousComposition,
  indexLeaves,
  jsonSchemaFields,
  mergeAllOf,
} from "./jsonSchema.ts";

describe("mergeAllOf", () => {
  it("merges properties and unions required", () => {
    expect(
      mergeAllOf({
        allOf: [
          { properties: { a: { type: "string" } }, required: ["a"] },
          { properties: { b: { type: "string" } }, required: ["b"] },
        ],
      }),
    ).toEqual({
      properties: { a: { type: "string" }, b: { type: "string" } },
      required: ["a", "b"],
    });
  });

  it("leaves conditional branches alone", () => {
    expect(
      mergeAllOf({ allOf: [{ if: {}, then: { required: ["a"] } }] }),
    ).toEqual({});
  });

  it("intersects source-qualified bank and use-site length bounds in either order", () => {
    const bank = { type: "string", minLength: 1, maxLength: 30 };
    const use = { minLength: 2, maxLength: 10 };
    expect(mergeAllOf({ allOf: [bank, use] })).toEqual({
      type: "string",
      minLength: 2,
      maxLength: 10,
    });
    expect(mergeAllOf({ allOf: [use, bank] })).toEqual({
      type: "string",
      minLength: 2,
      maxLength: 10,
    });
  });
  it("refuses empty length intersections and opaque competing constraints", () => {
    expect(() =>
      mergeAllOf({ allOf: [{ minLength: 11 }, { maxLength: 10 }] }),
    ).toThrow(AmbiguousComposition);
    expect(() =>
      mergeAllOf({ allOf: [{ pattern: "^A" }, { pattern: "Z$" }] }),
    ).toThrow(AmbiguousComposition);
  });
});

describe("jsonSchemaFields", () => {
  const schema = {
    type: "object",
    required: ["items"],
    properties: {
      items: {
        type: "array",
        minItems: 1,
        maxItems: 4,
        items: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              title: "Name",
              description: "Enter it.",
              maxLength: 5,
            },
            kind: { const: "x" },
          },
        },
      },
      note: { type: "string" },
    },
  };
  const flat = jsonSchemaFields(schema);

  it("walks array items as []", () => {
    expect([...flat.keys()]).toEqual(["items[].name", "items[].kind", "note"]);
  });

  it("requires fields only through required ancestors", () => {
    expect(
      ["items[].name", "items[].kind", "note"].map(
        (p) => flat.get(p)?.required,
      ),
    ).toEqual(["yes", "no", "no"]);
  });

  it("reads const as single-value enum", () => {
    expect(flat.get("items[].kind")?.rules).toEqual({
      enum: ["x"],
      maxOccurs: 4,
    });
  });

  it("reads maxItems around field as maxOccurs", () => {
    expect(
      ["items[].name", "note"].map((p) => flat.get(p)?.rules.maxOccurs),
    ).toEqual([4, 1]);
  });

  it("reads array without maxItems as unbounded", () => {
    const unbounded = jsonSchemaFields({
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { type: "object", properties: { name: { type: "string" } } },
        },
      },
    });
    expect(unbounded.get("items[].name")?.rules.maxOccurs).toBe("unbounded");
  });
});

describe("indexLeaves", () => {
  it("reads leaf occurrences only", () => {
    expect(
      indexLeaves({
        fieldOccurrences: [
          { path: "/key_contacts", leaf: false },
          { path: "/key_contacts/[]/address/city", leaf: true },
        ],
      }),
    ).toEqual(["key_contacts[].address.city"]);
  });
});
