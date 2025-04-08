import { RJSFSchema } from "@rjsf/utils";

import { UiSchema } from "src/components/applyForm/types";
import {
  validateFormData,
  validateFormSchema,
  validateUiSchema,
} from "src/components/applyForm/validate";

describe("validateFormSchema", () => {
  it("should validate a correct form schema", () => {
    const validSchema: RJSFSchema = {
      title: "test schema",
      properties: {
        name: { type: "string", title: "test name" },
      },
      required: ["name"],
    };

    expect(() => validateFormSchema(validSchema)).not.toThrow();
  });

  it("should throw an error for an invalid form schema", () => {
    const invalidSchema: RJSFSchema = {
      title: "test schema",
      properties: {
        name: { type: "invalid type" as "string", title: "test name" },
      },
      required: ["invalidRequired"],
    };

    expect(() => validateFormSchema(invalidSchema)).toThrow();
  });
});

describe("validateUiSchema", () => {
  it("should validate a correct UI schema", () => {
    const validUiSchema: UiSchema = [
      {
        type: "field",
        definition: "/properties/test",
      },
    ];

    expect(() => validateUiSchema(validUiSchema)).not.toThrow();
  });

  it("should throw an error for an invalid UI schema", () => {
    const invalidUiSchema: UiSchema = [
      {
        type: "field",
        definition: "test" as `/properties/${string}`,
      },
    ];

    expect(() => validateUiSchema(invalidUiSchema)).toThrow();
  });
});

describe("validateFormData", () => {
  it("should return false for valid form data", () => {
    const formData = new FormData();
    formData.append("name", "John Doe");

    const schema: RJSFSchema = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    };

    expect(validateFormData(formData, schema)).toBe(false);
  });

  it("should return validation errors for invalid form data", () => {
    const formData = new FormData();
    formData.append("age", "30");

    const schema: RJSFSchema = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    };

    const errors = validateFormData(formData, schema);
    expect(Array.isArray(errors)).toBe(true);
    expect(errors && errors.length).toBeGreaterThan(0);
  });
});
