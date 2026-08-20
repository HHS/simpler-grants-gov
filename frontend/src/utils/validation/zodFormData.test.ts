import { z } from "zod";

import {
  formDataToZodInput,
  getFieldSchema,
  getZodObjectSchema,
  isFieldInSchema,
  unwrapSchema,
} from "./zodFormData";

describe("formDataToZodInput", () => {
  it("converts FormData values using the Zod schema types", () => {
    const formData = new FormData();

    formData.set("name", "Alice");
    formData.set("age", "30");
    formData.set("amount", "$1,234");
    formData.set("active", "true");

    const schema = z.object({
      name: z.string(),
      age: z.number(),
      amount: z.number(),
      active: z.boolean(),
    });

    expect(formDataToZodInput(formData, schema)).toEqual({
      name: "Alice",
      age: 30,
      amount: 1234,
      active: true,
    });
  });

  it("converts false boolean strings to false", () => {
    const formData = new FormData();
    formData.set("active", "false");

    const schema = z.object({
      active: z.boolean(),
    });

    expect(formDataToZodInput(formData, schema)).toEqual({
      active: false,
    });
  });

  it("converts empty nullable fields to null", () => {
    const formData = new FormData();
    formData.set("description", "");

    const schema = z.object({
      description: z.string().nullable(),
    });

    expect(formDataToZodInput(formData, schema)).toEqual({
      description: null,
    });
  });

  it("converts missing nullable fields to null", () => {
    const formData = new FormData();

    const schema = z.object({
      description: z.string().nullable(),
    });

    expect(formDataToZodInput(formData, schema)).toEqual({
      description: null,
    });
  });

  it("converts missing non-nullable fields to undefined", () => {
    const formData = new FormData();

    const schema = z.object({
      name: z.string(),
    });

    expect(formDataToZodInput(formData, schema)).toEqual({
      name: undefined,
    });
  });

  it("preserves empty non-nullable strings", () => {
    const formData = new FormData();
    formData.set("name", "");

    const schema = z.object({
      name: z.string(),
    });

    expect(formDataToZodInput(formData, schema)).toEqual({
      name: "",
    });
  });

  it("normalizes valid date strings", () => {
    const formData = new FormData();
    formData.set("date", "08/19/2026");

    const schema = z.object({
      date: z.string().date(),
    });

    expect(formDataToZodInput(formData, schema)).toEqual({
      date: "2026-08-19",
    });
  });

  it("preserves invalid date strings so Zod can validate them", () => {
    const formData = new FormData();
    formData.set("date", "not-a-date");

    const schema = z.object({
      date: z.string().date(),
    });

    expect(formDataToZodInput(formData, schema)).toEqual({
      date: "not-a-date",
    });
  });

  it("uses field adapters instead of generic normalization", () => {
    const formData = new FormData();

    formData.append("items[0]", "one");
    formData.append("items[1]", "two");

    const schema = z.object({
      items: z.array(z.string()),
    });

    const result = formDataToZodInput(formData, schema, {
      items: (data) => [data.get("items[0]"), data.get("items[1]")],
    });

    expect(result).toEqual({
      items: ["one", "two"],
    });
  });

  it("leaves non-string FormData values unchanged", () => {
    const formData = new FormData();
    const file = new File(["hello"], "example.txt");

    formData.set("attachment", file);

    const schema = z.object({
      attachment: z.any(),
    });

    expect(formDataToZodInput(formData, schema)).toEqual({
      attachment: file,
    });
  });

  it("throws when passed a non-object schema", () => {
    const formData = new FormData();

    expect(() => formDataToZodInput(formData, z.string())).toThrow(
      "Expected a Zod object schema",
    );
  });
});

describe("getZodObjectSchema", () => {
  it("returns a Zod object schema", () => {
    const schema = z.object({
      value: z.string(),
    });

    expect(getZodObjectSchema(schema)).toBe(schema);
  });

  it("unwraps ZodEffects added by superRefine", () => {
    const objectSchema = z.object({
      minimum: z.number(),
      maximum: z.number(),
    });

    const schema = objectSchema.superRefine(() => {});

    expect(getZodObjectSchema(schema)).toBe(objectSchema);
  });

  it("returns null for non-object schemas", () => {
    expect(getZodObjectSchema(z.string())).toBeNull();
  });
});

describe("unwrapSchema", () => {
  it("unwraps nullable schemas", () => {
    const result = unwrapSchema(z.string().nullable());

    expect(result.schema).toBeInstanceOf(z.ZodString);
    expect(result.nullable).toBe(true);
    expect(result.optional).toBe(false);
  });

  it("unwraps optional schemas", () => {
    const result = unwrapSchema(z.string().optional());

    expect(result.schema).toBeInstanceOf(z.ZodString);
    expect(result.nullable).toBe(false);
    expect(result.optional).toBe(true);
  });

  it("unwraps nested nullable and optional wrappers", () => {
    const result = unwrapSchema(z.string().nullable().optional());

    expect(result.schema).toBeInstanceOf(z.ZodString);
    expect(result.nullable).toBe(true);
    expect(result.optional).toBe(true);
  });
});

describe("getFieldSchema", () => {
  it("returns a field schema from a Zod object", () => {
    const schema = z.object({
      name: z.string(),
    });

    const fieldSchema = getFieldSchema(schema, "name");

    expect(fieldSchema).toBeInstanceOf(z.ZodString);
  });

  it("returns a field schema from an effects-wrapped object", () => {
    const schema = z
      .object({
        name: z.string(),
      })
      .superRefine(() => {});

    const fieldSchema = getFieldSchema(schema, "name");

    expect(fieldSchema).toBeInstanceOf(z.ZodString);
  });

  it("returns undefined for an unknown field", () => {
    const schema = z.object({
      name: z.string(),
    });

    expect(getFieldSchema(schema, "missing")).toBeUndefined();
  });
});

describe("isFieldInSchema", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  it("returns true for fields in the schema", () => {
    expect(isFieldInSchema(schema, "name")).toBe(true);
    expect(isFieldInSchema(schema, "age")).toBe(true);
  });

  it("returns false for fields not in the schema", () => {
    expect(isFieldInSchema(schema, "missing")).toBe(false);
  });

  it("works with effects-wrapped schemas", () => {
    const refinedSchema = schema.superRefine(() => {});

    expect(isFieldInSchema(refinedSchema, "name")).toBe(true);
  });

  it("returns false for non-object schemas", () => {
    expect(isFieldInSchema(z.string(), "name")).toBe(false);
  });
});
