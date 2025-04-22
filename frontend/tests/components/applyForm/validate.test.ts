import { RJSFSchema } from "@rjsf/utils";

import { UiSchema } from "src/components/applyForm/types";
import {
  validateFormData,
  validateUiSchema,
} from "src/components/applyForm/validate";

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

  describe("validateUiSchema", () => {
    it("should validate a correct UI schema", () => {
      const validUiSchema: UiSchema = [
        {
          type: "field",
          schema: {
            title: "test custom schema",
            type: "string",
          },
        },
        {
          type: "section",
          name: "test",
          label: "test",
          children: [
            {
              type: "field",
              definition: "/properties/TestField",
            },
            {
              type: "section",
              name: "test",
              label: "test",
              children: [
                {
                  type: "field",
                  definition: "/properties/TestField",
                },
              ],
            },
          ],
        },
        {
          type: "field",
          definition: "/properties/TestField",
        },
      ];

      const schemaErrors = validateUiSchema(validUiSchema);

      expect(schemaErrors).toBeFalsy();
    });

    it("should show an error for an invalid UI schema", () => {
      const invalidUiSchema: UiSchema = [
        {
          type: "field",
          definition: "test" as `/properties/${string}`,
        },
        {
          type: "field",
          definition: "/properties/test123", // no numbers
        },
      ];

      const schemaErrors = validateUiSchema(invalidUiSchema);
      expect(Array.isArray(schemaErrors)).toBe(true);
      expect(schemaErrors && schemaErrors[0]?.instancePath).toMatch(
        "/0/definition",
      );
      expect(schemaErrors && schemaErrors[0]?.message).toMatch(
        'must match pattern "^/properties/[a-zA-Z]+$"',
      );
      expect(schemaErrors && schemaErrors[7]?.instancePath).toMatch(
        "/1/definition",
      );
      expect(schemaErrors && schemaErrors[7]?.message).toMatch(
        'must match pattern "^/properties/[a-zA-Z]+$"',
      );
    });
  });
});
