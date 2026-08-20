import { z } from "zod";

import {
  getTranslatedValidationMessage,
  getValidationTypeFromZodIssue,
  getZodValidationErrors,
  mapApiValidationErrors,
} from "./zodValidation";

type ValidationTranslator = {
  has: (key: string) => boolean;
  (key: string): string;
};

function createTranslator(
  translations: Record<string, string>,
): ValidationTranslator {
  const translator = ((key: string) =>
    translations[key] ?? key) as ValidationTranslator;

  translator.has = (key: string) => key in translations;

  return translator;
}

describe("getValidationTypeFromZodIssue", () => {
  it("treats an empty required string as required", () => {
    const schema = z.string().min(1);
    const result = schema.safeParse("");

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getValidationTypeFromZodIssue(result.error.issues[0], "", schema),
    ).toBe("required");
  });

  it("does not treat an empty optional string as required", () => {
    const fieldSchema = z.string().min(1).optional();
    const baseSchema = z.string().min(1);
    const result = baseSchema.safeParse("");

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getValidationTypeFromZodIssue(result.error.issues[0], "", fieldSchema),
    ).toBe("min_or_max_value");
  });

  it("does not treat an empty nullable string as required", () => {
    const fieldSchema = z.string().min(1).nullable();
    const baseSchema = z.string().min(1);
    const result = baseSchema.safeParse("");

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getValidationTypeFromZodIssue(result.error.issues[0], "", fieldSchema),
    ).toBe("min_or_max_value");
  });

  it("maps too_small to min_or_max_value", () => {
    const schema = z.number().min(10);
    const result = schema.safeParse(5);

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getValidationTypeFromZodIssue(result.error.issues[0], 5, schema),
    ).toBe("min_or_max_value");
  });

  it("maps too_big to min_or_max_value", () => {
    const schema = z.number().max(10);
    const result = schema.safeParse(20);

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getValidationTypeFromZodIssue(result.error.issues[0], 20, schema),
    ).toBe("min_or_max_value");
  });

  it("maps undefined invalid_type to required", () => {
    const schema = z.string();
    const result = schema.safeParse(undefined);

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getValidationTypeFromZodIssue(result.error.issues[0], undefined, schema),
    ).toBe("required");
  });

  it("maps null invalid_type to not_null", () => {
    const schema = z.string();
    const result = schema.safeParse(null);

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getValidationTypeFromZodIssue(result.error.issues[0], null, schema),
    ).toBe("not_null");
  });

  it("maps other invalid_type issues to invalid", () => {
    const schema = z.number();
    const result = schema.safeParse("not-a-number");

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getValidationTypeFromZodIssue(
        result.error.issues[0],
        "not-a-number",
        schema,
      ),
    ).toBe("invalid");
  });

  it("maps invalid_string to invalid", () => {
    const schema = z.string().email();
    const result = schema.safeParse("not-an-email");

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getValidationTypeFromZodIssue(
        result.error.issues[0],
        "not-an-email",
        schema,
      ),
    ).toBe("invalid");
  });

  it("uses the custom issue message as the validation type", () => {
    const schema = z.string().superRefine((_value, ctx) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "other_field_numeric_order",
      });
    });

    const result = schema.safeParse("value");

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getValidationTypeFromZodIssue(result.error.issues[0], "value", schema),
    ).toBe("other_field_numeric_order");
  });

  it("returns null for unsupported Zod issue types", () => {
    const schema = z.literal("expected");
    const result = schema.safeParse("other");

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getValidationTypeFromZodIssue(result.error.issues[0], "other", schema),
    ).toBeNull();
  });
});

describe("getTranslatedValidationMessage", () => {
  const fieldTranslations = createTranslator({
    "award_floor.required": "Award minimum is required.",
  });

  const genericTranslations = createTranslator({
    required: "This field is required.",
    invalid: "Enter a valid value.",
  });

  it("prefers a field-specific translation", () => {
    expect(
      getTranslatedValidationMessage(
        fieldTranslations,
        genericTranslations,
        "award_floor",
        "required",
        "Fallback",
      ),
    ).toBe("Award minimum is required.");
  });

  it("uses a generic translation when no field-specific translation exists", () => {
    expect(
      getTranslatedValidationMessage(
        fieldTranslations,
        genericTranslations,
        "award_ceiling",
        "required",
        "Fallback",
      ),
    ).toBe("This field is required.");
  });

  it("uses the fallback when no translation exists", () => {
    expect(
      getTranslatedValidationMessage(
        fieldTranslations,
        genericTranslations,
        "award_floor",
        "something_unknown",
        "Original validation message",
      ),
    ).toBe("Original validation message");
  });

  it("uses the fallback when validation type is null", () => {
    expect(
      getTranslatedValidationMessage(
        fieldTranslations,
        genericTranslations,
        "award_floor",
        null,
        "Original validation message",
      ),
    ).toBe("Original validation message");
  });
});

describe("getZodValidationErrors", () => {
  const genericTranslations = createTranslator({
    required: "This field is required.",
    invalid: "Enter a valid value.",
    min_or_max_value: "Enter a value within the allowed range.",
  });

  it("maps Zod issues to translated field errors", () => {
    const schema = z.object({
      name: z.string(),
      amount: z.number().min(0),
    });

    const validationData = {
      name: undefined,
      amount: -1,
    };

    const result = schema.safeParse(validationData);

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    const errors = getZodValidationErrors(
      result.error,
      validationData,
      schema,
      createTranslator({
        "amount.min_or_max_value": "Amount must be positive.",
      }),
      genericTranslations,
    );

    expect(errors).toEqual({
      name: ["This field is required."],
      amount: ["Amount must be positive."],
    });
  });

  it("can return errors for only one requested field", () => {
    const schema = z.object({
      first: z.string(),
      second: z.string(),
    });

    const validationData = {
      first: undefined,
      second: undefined,
    };

    const result = schema.safeParse(validationData);

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    const errors = getZodValidationErrors(
      result.error,
      validationData,
      schema,
      createTranslator({}),
      genericTranslations,
      "first",
    );

    expect(errors).toEqual({
      first: ["This field is required."],
    });
  });

  it("preserves multiple validation errors for the same field", () => {
    const schema = z
      .object({
        amount: z.number(),
        maximum: z.number(),
      })
      .superRefine((_, ctx) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "maximum_numeric_order",
        });

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "another_numeric_order",
        });
      });

    const validationData = {
      amount: 10,
      maximum: 5,
    };

    const result = schema.safeParse(validationData);

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    const errors = getZodValidationErrors(
      result.error,
      validationData,
      schema,
      createTranslator({
        "amount.maximum_numeric_order": "Amount must not exceed maximum.",
        "amount.another_numeric_order": "Another relationship failed.",
      }),
      genericTranslations,
    );

    expect(errors).toEqual({
      amount: [
        "Amount must not exceed maximum.",
        "Another relationship failed.",
      ],
    });
  });

  it("ignores issues without a field path", () => {
    const schema = z
      .object({
        name: z.string(),
      })
      .superRefine((_data, ctx) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "schema_error",
          path: [],
        });
      });

    const validationData = {
      name: "valid",
    };

    const result = schema.safeParse(validationData);

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(
      getZodValidationErrors(
        result.error,
        validationData,
        schema,
        createTranslator({}),
        genericTranslations,
      ),
    ).toEqual({});
  });

  it("ignores issues for fields outside the schema", () => {
    const schema = z.object({
      name: z.string(),
    });

    const error = new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["unknown_field"],
        message: "invalid",
      },
    ]);

    expect(
      getZodValidationErrors(
        error,
        {},
        schema,
        createTranslator({}),
        genericTranslations,
      ),
    ).toEqual({});
  });
});

describe("mapApiValidationErrors", () => {
  const genericTranslations = createTranslator({
    required: "This field is required.",
    invalid: "Enter a valid value.",
  });

  const schema = z.object({
    name: z.string(),
    amount: z.number(),
  });

  it("maps known API fields to translated validation errors", () => {
    const result = mapApiValidationErrors(
      {
        errors: [
          {
            field: "name",
            type: "required",
            message: "Raw backend message",
          },
        ],
      },
      schema,
      createTranslator({
        "name.required": "Name is required.",
      }),
      genericTranslations,
      "Something went wrong.",
    );

    expect(result).toEqual({
      validationErrors: {
        name: ["Name is required."],
      },
      errorMessage: undefined,
    });
  });

  it("uses generic translations when no field-specific translation exists", () => {
    const result = mapApiValidationErrors(
      {
        errors: [
          {
            field: "name",
            type: "required",
            message: "Raw backend message",
          },
        ],
      },
      schema,
      createTranslator({}),
      genericTranslations,
      "Something went wrong.",
    );

    expect(result.validationErrors).toEqual({
      name: ["This field is required."],
    });
  });

  it("falls back to the API error message when no translation exists", () => {
    const result = mapApiValidationErrors(
      {
        errors: [
          {
            field: "name",
            type: "unknown_validation_type",
            message: "Backend-specific validation message",
          },
        ],
      },
      schema,
      createTranslator({}),
      genericTranslations,
      "Something went wrong.",
    );

    expect(result.validationErrors).toEqual({
      name: ["Backend-specific validation message"],
    });
  });

  it("preserves multiple API validation errors for the same field", () => {
    const result = mapApiValidationErrors(
      {
        errors: [
          {
            field: "amount",
            type: "invalid",
            message: "First backend error",
          },
          {
            field: "amount",
            type: "required",
            message: "Second backend error",
          },
        ],
      },
      schema,
      createTranslator({}),
      genericTranslations,
      "Something went wrong.",
    );

    expect(result.validationErrors).toEqual({
      amount: ["Enter a valid value.", "This field is required."],
    });
  });

  it("surfaces errors for unknown fields as top-level errors", () => {
    const result = mapApiValidationErrors(
      {
        errors: [
          {
            field: "unknown_field",
            type: "invalid",
            message: "Unknown field failed.",
          },
        ],
      },
      schema,
      createTranslator({}),
      genericTranslations,
      "Something went wrong.",
    );

    expect(result).toEqual({
      validationErrors: undefined,
      errorMessage: "Unknown field failed.",
    });
  });

  it("surfaces errors without a field as top-level errors", () => {
    const result = mapApiValidationErrors(
      {
        errors: [
          {
            type: "invalid",
            message: "Schema-level validation failed.",
          },
        ],
      },
      schema,
      createTranslator({}),
      genericTranslations,
      "Something went wrong.",
    );

    expect(result).toEqual({
      validationErrors: undefined,
      errorMessage: "Schema-level validation failed.",
    });
  });

  it("joins multiple unmapped errors into one top-level message", () => {
    const result = mapApiValidationErrors(
      {
        errors: [
          {
            field: "unknown_one",
            message: "First error.",
          },
          {
            field: "unknown_two",
            message: "Second error.",
          },
        ],
      },
      schema,
      createTranslator({}),
      genericTranslations,
      "Something went wrong.",
    );

    expect(result.errorMessage).toBe("First error. Second error.");
  });

  it("can return both mapped field errors and unmapped top-level errors", () => {
    const result = mapApiValidationErrors(
      {
        errors: [
          {
            field: "name",
            type: "required",
            message: "Name backend error",
          },
          {
            field: "unknown_field",
            message: "Other backend error",
          },
        ],
      },
      schema,
      createTranslator({}),
      genericTranslations,
      "Something went wrong.",
    );

    expect(result).toEqual({
      validationErrors: {
        name: ["This field is required."],
      },
      errorMessage: "Other backend error",
    });
  });

  it("uses the response message when there are no individual errors", () => {
    const result = mapApiValidationErrors(
      {
        message: "Request validation failed.",
      },
      schema,
      createTranslator({}),
      genericTranslations,
      "Something went wrong.",
    );

    expect(result).toEqual({
      validationErrors: undefined,
      errorMessage: "Request validation failed.",
    });
  });

  it("uses the generic message when the response contains no usable message", () => {
    const result = mapApiValidationErrors(
      {},
      schema,
      createTranslator({}),
      genericTranslations,
      "Something went wrong.",
    );

    expect(result).toEqual({
      validationErrors: undefined,
      errorMessage: "Something went wrong.",
    });
  });

  it("treats nested API field paths as unmapped", () => {
    const nestedSchema = z.object({
      address: z.object({
        city: z.string(),
      }),
    });

    const result = mapApiValidationErrors(
      {
        errors: [
          {
            field: "address.city",
            type: "invalid",
            message: "Invalid city.",
          },
        ],
      },
      nestedSchema,
      createTranslator({}),
      genericTranslations,
      "Something went wrong.",
    );

    expect(result).toEqual({
      validationErrors: undefined,
      errorMessage: "Invalid city.",
    });
  });
});
