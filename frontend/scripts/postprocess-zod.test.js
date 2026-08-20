/* eslint-env jest */
const {
  addRelationalValidations,
  buildSuperRefine,
  findGeneratedSchemaInitializers,
  getSchemaTypes,
  getTargetValidationType,
  getValidationGuards,
  getValidationType,
  getValueGuard,
} = require("./postprocess-zod");

const { describe, expect, it } = require("@jest/globals");

describe("getSchemaTypes", () => {
  it("returns a single schema type", () => {
    expect(getSchemaTypes({ type: "number" })).toEqual(["number"]);
  });

  it("removes null from nullable OpenAPI types", () => {
    expect(
      getSchemaTypes({
        type: ["string", "null"],
      }),
    ).toEqual(["string"]);
  });

  it("returns an empty array when type is not present", () => {
    expect(getSchemaTypes({})).toEqual([]);
  });

  it("returns an empty array for undefined schema", () => {
    expect(getSchemaTypes(undefined)).toEqual([]);
  });
});

describe("getValueGuard", () => {
  it("creates a date guard for date strings", () => {
    expect(
      getValueGuard(
        {
          type: "string",
          format: "date",
        },
        "data.post_date",
      ),
    ).toBe("zod.string().date().safeParse(data.post_date).success");
  });

  it("creates a number guard for numeric fields", () => {
    expect(
      getValueGuard(
        {
          type: "number",
        },
        "data.amount",
      ),
    ).toBe('typeof data.amount === "number"');
  });

  it("creates a number guard for integer fields", () => {
    expect(
      getValueGuard(
        {
          type: "integer",
        },
        "data.amount",
      ),
    ).toBe('typeof data.amount === "number"');
  });

  it("creates a string guard for string fields", () => {
    expect(
      getValueGuard(
        {
          type: "string",
        },
        "data.name",
      ),
    ).toBe('typeof data.name === "string"');
  });

  it("returns null for unsupported field types", () => {
    expect(
      getValueGuard(
        {
          type: "array",
        },
        "data.values",
      ),
    ).toBeNull();
  });
});

describe("getValidationGuards", () => {
  it("returns guards for both relational fields", () => {
    expect(
      getValidationGuards(
        {
          type: "number",
        },
        {
          type: "string",
        },
        'data["left"]',
        'data["right"]',
      ),
    ).toEqual([
      'typeof data["left"] === "number"',
      'typeof data["right"] === "string"',
    ]);
  });

  it("omits unsupported guards", () => {
    expect(
      getValidationGuards(
        {
          type: "array",
        },
        {
          type: "number",
        },
        'data["left"]',
        'data["right"]',
      ),
    ).toEqual(['typeof data["right"] === "number"']);
  });
});

describe("getValidationType", () => {
  it("identifies date relationships", () => {
    expect(
      getValidationType(
        "post_date",
        "close_date",
        {
          type: "string",
          format: "date",
        },
        {
          type: ["string", "null"],
          format: "date",
        },
      ),
    ).toBe("date_order");
  });

  it("identifies numeric relationships", () => {
    expect(
      getValidationType(
        "award_floor",
        "award_ceiling",
        {
          type: "number",
        },
        {
          type: "integer",
        },
      ),
    ).toBe("numeric_order");
  });

  it("identifies string relationships", () => {
    expect(
      getValidationType(
        "left",
        "right",
        {
          type: "string",
        },
        {
          type: "string",
        },
      ),
    ).toBe("string_order");
  });

  it("throws when the relationship type cannot be determined", () => {
    expect(() =>
      getValidationType(
        "left",
        "right",
        {
          type: "number",
        },
        {
          type: "string",
        },
      ),
    ).toThrow(
      "Unable to determine relational validation type for left and right",
    );
  });
});

describe("getTargetValidationType", () => {
  it("uses the right field when generating an error for the left field", () => {
    expect(
      getTargetValidationType(
        "award_floor",
        "award_floor",
        "award_ceiling",
        "numeric_order",
      ),
    ).toBe("award_ceiling_numeric_order");
  });

  it("uses the left field when generating an error for the right field", () => {
    expect(
      getTargetValidationType(
        "award_ceiling",
        "award_floor",
        "award_ceiling",
        "numeric_order",
      ),
    ).toBe("award_floor_numeric_order");
  });

  it("throws for a target field outside the relationship", () => {
    expect(() =>
      getTargetValidationType(
        "something_else",
        "award_floor",
        "award_ceiling",
        "numeric_order",
      ),
    ).toThrow(
      "Relational validation target field something_else is not award_floor or award_ceiling",
    );
  });
});

describe("buildSuperRefine", () => {
  it("generates numeric relational validation for both fields", () => {
    const result = buildSuperRefine(
      [
        {
          left_field: "award_floor",
          operator: "less_than_or_equal",
          right_field: "award_ceiling",
        },
      ],
      {
        award_floor: {
          type: "number",
        },
        award_ceiling: {
          type: "number",
        },
      },
    );

    expect(result).toContain('data["award_floor"] <= data["award_ceiling"]');

    expect(result).toContain('typeof data["award_floor"] === "number"');

    expect(result).toContain('typeof data["award_ceiling"] === "number"');

    expect(result).toContain('path: ["award_floor"]');

    expect(result).toContain('message: "award_ceiling_numeric_order"');

    expect(result).toContain('path: ["award_ceiling"]');

    expect(result).toContain('message: "award_floor_numeric_order"');
  });

  it("generates date validation guards", () => {
    const result = buildSuperRefine(
      [
        {
          left_field: "post_date",
          operator: "less_than_or_equal",
          right_field: "close_date",
        },
      ],
      {
        post_date: {
          type: "string",
          format: "date",
        },
        close_date: {
          type: ["string", "null"],
          format: "date",
        },
      },
    );

    expect(result).toContain(
      'zod.string().date().safeParse(data["post_date"]).success',
    );

    expect(result).toContain(
      'zod.string().date().safeParse(data["close_date"]).success',
    );

    expect(result).toContain('message: "close_date_date_order"');

    expect(result).toContain('message: "post_date_date_order"');
  });

  it.each([
    ["less_than", "<"],
    ["less_than_or_equal", "<="],
    ["greater_than", ">"],
    ["greater_than_or_equal", ">="],
    ["equal", "==="],
    ["not_equal", "!=="],
  ])("generates the %s operator", (operator, expression) => {
    const result = buildSuperRefine(
      [
        {
          left_field: "left",
          operator,
          right_field: "right",
        },
      ],
      {
        left: {
          type: "number",
        },
        right: {
          type: "number",
        },
      },
    );

    expect(result).toContain(`data["left"] ${expression} data["right"]`);
  });

  it("throws for unsupported operators", () => {
    expect(() =>
      buildSuperRefine(
        [
          {
            left_field: "left",
            operator: "explode_everything",
            right_field: "right",
          },
        ],
        {
          left: {
            type: "number",
          },
          right: {
            type: "number",
          },
        },
      ),
    ).toThrow("Unsupported relational validation operator: explode_everything");
  });

  it("throws when the left relational field is missing", () => {
    expect(() =>
      buildSuperRefine(
        [
          {
            left_field: "missing",
            operator: "less_than",
            right_field: "right",
          },
        ],
        {
          right: {
            type: "number",
          },
        },
      ),
    ).toThrow(
      "Relational validation references missing fields: missing, right",
    );
  });

  it("throws when the right relational field is missing", () => {
    expect(() =>
      buildSuperRefine(
        [
          {
            left_field: "left",
            operator: "less_than",
            right_field: "missing",
          },
        ],
        {
          left: {
            type: "number",
          },
        },
      ),
    ).toThrow("Relational validation references missing fields: left, missing");
  });

  it("generates multiple relational validation rules", () => {
    const result = buildSuperRefine(
      [
        {
          left_field: "minimum",
          operator: "less_than_or_equal",
          right_field: "maximum",
        },
        {
          left_field: "maximum",
          operator: "less_than_or_equal",
          right_field: "total",
        },
      ],
      {
        minimum: {
          type: "number",
        },
        maximum: {
          type: "number",
        },
        total: {
          type: "number",
        },
      },
    );

    expect(result).toContain('data["minimum"] <= data["maximum"]');

    expect(result).toContain('data["maximum"] <= data["total"]');

    expect(result).toContain('message: "maximum_numeric_order"');

    expect(result).toContain('message: "total_numeric_order"');
  });
});

describe("findGeneratedSchemaInitializers", () => {
  it("finds generated schema variable initializers", () => {
    const source = `
export const FirstSchema = zod.object({
  name: zod.string(),
});

export const SecondSchema = zod.object({
  amount: zod.number(),
});
`;

    const result = findGeneratedSchemaInitializers(source);

    expect(result.has("FirstSchema")).toBe(true);
    expect(result.has("SecondSchema")).toBe(true);

    const first = result.get("FirstSchema");

    expect(first).toBeDefined();

    expect(source.slice(first.start, first.end)).toContain("zod.object");
  });

  it("ignores declarations without initializers", () => {
    const source = `
let Something;

export const ExampleSchema = zod.object({
  name: zod.string(),
});
`;

    const result = findGeneratedSchemaInitializers(source);

    expect(result.has("Something")).toBe(false);
    expect(result.has("ExampleSchema")).toBe(true);
  });

  it("ignores non-variable statements", () => {
    const source = `
function helper() {
  return true;
}

export const ExampleSchema = zod.object({
  name: zod.string(),
});
`;

    const result = findGeneratedSchemaInitializers(source);

    expect(result.size).toBe(1);
    expect(result.has("ExampleSchema")).toBe(true);
  });
});

describe("addRelationalValidations", () => {
  it("adds superRefine to the matching generated Zod schema", () => {
    const source = `
export const ExampleSchema = zod.object({
  minimum: zod.number(),
  maximum: zod.number(),
});
`;

    const result = addRelationalValidations(source, [
      {
        schemaName: "ExampleSchema",
        properties: {
          minimum: {
            type: "number",
          },
          maximum: {
            type: "number",
          },
        },
        validations: [
          {
            left_field: "minimum",
            operator: "less_than_or_equal",
            right_field: "maximum",
          },
        ],
      },
    ]);

    expect(result).toContain("export const ExampleSchema = zod.object");

    expect(result).toContain(".superRefine((data, ctx) =>");

    expect(result).toContain('data["minimum"] <= data["maximum"]');

    expect(result).toContain('message: "maximum_numeric_order"');

    expect(result).toContain('message: "minimum_numeric_order"');
  });

  it("adds relational validation to multiple generated schemas", () => {
    const source = `
export const FirstSchema = zod.object({
  minimum: zod.number(),
  maximum: zod.number(),
});

export const SecondSchema = zod.object({
  start_date: zod.string().date(),
  end_date: zod.string().date(),
});
`;

    const result = addRelationalValidations(source, [
      {
        schemaName: "FirstSchema",
        properties: {
          minimum: {
            type: "number",
          },
          maximum: {
            type: "number",
          },
        },
        validations: [
          {
            left_field: "minimum",
            operator: "less_than_or_equal",
            right_field: "maximum",
          },
        ],
      },
      {
        schemaName: "SecondSchema",
        properties: {
          start_date: {
            type: "string",
            format: "date",
          },
          end_date: {
            type: "string",
            format: "date",
          },
        },
        validations: [
          {
            left_field: "start_date",
            operator: "less_than_or_equal",
            right_field: "end_date",
          },
        ],
      },
    ]);

    expect(result).toContain('data["minimum"] <= data["maximum"]');

    expect(result).toContain('data["start_date"] <= data["end_date"]');

    expect(result).toContain('message: "maximum_numeric_order"');

    expect(result).toContain('message: "end_date_date_order"');
  });

  it("does not modify schemas without relational validation metadata", () => {
    const source = `
export const ExampleSchema = zod.object({
  name: zod.string(),
});
`;

    const result = addRelationalValidations(source, []);

    expect(result).toBe(source);
  });

  it("warns and leaves source unchanged when a generated schema cannot be found", () => {
    const source = `
export const ExistingSchema = zod.object({
  value: zod.number(),
});
`;

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = addRelationalValidations(source, [
      {
        schemaName: "MissingSchema",
        properties: {
          left: {
            type: "number",
          },
          right: {
            type: "number",
          },
        },
        validations: [
          {
            left_field: "left",
            operator: "less_than",
            right_field: "right",
          },
        ],
      },
    ]);

    expect(result).toBe(source);

    expect(warnSpy).toHaveBeenCalledWith(
      "Could not find generated Zod schema for OpenAPI schema: MissingSchema",
    );

    warnSpy.mockRestore();
  });

  it("preserves surrounding generated source", () => {
    const source = `
import { z as zod } from "zod";

export const FirstSchema = zod.object({
  name: zod.string(),
});

export const ExampleSchema = zod.object({
  minimum: zod.number(),
  maximum: zod.number(),
});

export type Example = {
  something: string;
};
`;

    const result = addRelationalValidations(source, [
      {
        schemaName: "ExampleSchema",
        properties: {
          minimum: {
            type: "number",
          },
          maximum: {
            type: "number",
          },
        },
        validations: [
          {
            left_field: "minimum",
            operator: "less_than_or_equal",
            right_field: "maximum",
          },
        ],
      },
    ]);

    expect(result).toContain('import { z as zod } from "zod";');

    expect(result).toContain("export const FirstSchema = zod.object");

    expect(result).toContain("export type Example =");

    expect(result).toContain('data["minimum"] <= data["maximum"]');
  });
});
