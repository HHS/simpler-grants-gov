import { describe, expect, it } from "vitest";

import { jsonSchemaFields } from "./harness/flatten/jsonSchema.ts";
import { uiSchemaFields } from "./harness/flatten/uiSchema.ts";

describe("scalar array answer leaves", () => {
  const control = {
    type: "Control",
    scope: "#/properties/files",
    label: "Files",
  };
  const schema = {
    type: "object",
    required: ["files"],
    properties: {
      files: {
        type: "array",
        title: "Files",
        description: "In order",
        minItems: 1,
        maxItems: 100,
        items: { type: "string", format: "uuid" },
      },
    },
  };
  it("compares item constraints and list wording at the index's repeated leaf", () => {
    const fields = jsonSchemaFields(schema);
    expect([...fields.keys()]).toEqual(["files[]"]);
    expect(fields.get("files[]")).toMatchObject({
      label: "Files",
      help: "In order",
      required: "yes",
      rules: { format: "uuid", maxOccurs: 100 },
    });
    expect([...uiSchemaFields(control, fields).keys()]).toEqual(["files[]"]);
  });
  it("keeps missing controls visible under their actual path", () => {
    expect([...uiSchemaFields(control, new Map()).keys()]).toEqual(["files"]);
  });
  it("does not mistake a scalar field for a repeated value", () => {
    const fields = jsonSchemaFields({
      type: "object",
      properties: { files: { type: "string" } },
    });
    expect([...uiSchemaFields(control, fields).keys()]).toEqual(["files"]);
  });
  it("multiplies nested object/list occurrences and preserves enum membership", () => {
    const fields = jsonSchemaFields({
      type: "object",
      required: ["rows"],
      properties: {
        rows: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: {
            type: "object",
            required: ["choices"],
            properties: {
              choices: {
                type: "array",
                minItems: 1,
                maxItems: 2,
                items: { type: "string", enum: ["A", "B"] },
              },
            },
          },
        },
      },
    });
    expect(fields.get("rows[].choices[]")).toMatchObject({
      required: "yes",
      rules: { maxOccurs: 6, enum: ["A", "B"] },
    });
  });
  it("keeps optional, empty-permitted and unbounded lists distinct", () => {
    const optional = structuredClone(schema);
    optional.required = [];
    expect(jsonSchemaFields(optional).get("files[]")?.required).toBe("no");
    optional.required = ["files"];
    optional.properties.files.minItems = 0;
    expect(jsonSchemaFields(optional).get("files[]")?.required).toBe("no");
    const unbounded = { type: "array", items: { type: "string" } };
    expect(jsonSchemaFields(unbounded).get("[]")?.rules.maxOccurs).toBe(
      "unbounded",
    );
  });
});
