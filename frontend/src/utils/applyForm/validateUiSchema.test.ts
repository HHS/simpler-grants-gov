import { RJSFSchema } from "@rjsf/utils";
import { UiSchema } from "src/types/applyForm/types";

import { validateJsonBySchema, validateUiSchema } from "./validateUiSchema";

describe("validateFormData", () => {
  it("should return false for valid form data", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    };

    expect(validateJsonBySchema({ name: "John Doe" }, schema)).toBe(false);
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

    const errors = validateJsonBySchema(formData, schema);
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

    it("should validate a Table multiField UI schema", () => {
      const validUiSchema: UiSchema = [
        {
          type: "section",
          name: "table_demo",
          label: "Table Demo",
          children: [
            {
              type: "multiField",
              name: "summary_table",
              widget: "Table",
              definition: [
                "/properties/first_value",
                "/properties/second_value",
              ],
              children: {
                columns: [
                  {
                    columnHeader: "Item",
                    width: 40,
                  },
                  {
                    columnHeader: "First Value",
                    width: 30,
                  },
                  {
                    columnHeader: "Second Value",
                    width: 30,
                  },
                ],
                rows: [
                  {
                    cells: [
                      {
                        type: "plainText",
                        staticContent: "First Row",
                      },
                      {
                        type: "input",
                        definition: "/properties/first_value",
                      },
                      {
                        type: "readOnly",
                        definition: "/properties/second_value",
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ];

      const schemaErrors = validateUiSchema(validUiSchema);

      expect(schemaErrors).toBeFalsy();
    });

    it("should invalidate a Table multiField without required configuration", () => {
      const invalidUiSchema = [
        {
          type: "multiField",
          name: "summary_table",
          widget: "Table",
        },
      ] as unknown as UiSchema;

      const schemaErrors = validateUiSchema(invalidUiSchema);

      expect(Array.isArray(schemaErrors)).toBe(true);

      const hasMissingTableConfigurationError =
        Array.isArray(schemaErrors) &&
        schemaErrors.some((error) => {
          const instancePath =
            typeof error.instancePath === "string" ? error.instancePath : "";
          const message =
            typeof error.message === "string" ? error.message : "";

          return (
            instancePath === "/0" &&
            (message.includes("definition") || message.includes("children"))
          );
        });

      expect(hasMissingTableConfigurationError).toBe(true);
    });

    it("should invalidate a Table multiField without definition", () => {
      const invalidUiSchema = [
        {
          type: "multiField",
          name: "summary_table",
          widget: "Table",
          children: {
            columns: [
              {
                columnHeader: "Item",
              },
            ],
            rows: [
              {
                cells: [
                  {
                    type: "plainText",
                    staticContent: "First Row",
                  },
                ],
              },
            ],
          },
        },
      ] as unknown as UiSchema;

      const schemaErrors = validateUiSchema(invalidUiSchema);

      expect(Array.isArray(schemaErrors)).toBe(true);

      const hasMissingDefinitionError =
        Array.isArray(schemaErrors) &&
        schemaErrors.some((error) => {
          const instancePath =
            typeof error.instancePath === "string" ? error.instancePath : "";
          const message =
            typeof error.message === "string" ? error.message : "";

          return instancePath === "/0" && message.includes("definition");
        });

      expect(hasMissingDefinitionError).toBe(true);
    });

    it("should invalidate a plainText table cell without staticContent", () => {
      const invalidUiSchema = [
        {
          type: "multiField",
          name: "summary_table",
          widget: "Table",
          definition: ["/properties/first_value"],
          children: {
            columns: [
              {
                columnHeader: "Item",
              },
            ],
            rows: [
              {
                cells: [
                  {
                    type: "plainText",
                  },
                ],
              },
            ],
          },
        },
      ] as unknown as UiSchema;

      const schemaErrors = validateUiSchema(invalidUiSchema);

      expect(Array.isArray(schemaErrors)).toBe(true);

      const hasMissingStaticContentError =
        Array.isArray(schemaErrors) &&
        schemaErrors.some((error) => {
          const instancePath =
            typeof error.instancePath === "string" ? error.instancePath : "";
          const message =
            typeof error.message === "string" ? error.message : "";

          return (
            instancePath === "/0/children/rows/0/cells/0" &&
            message.includes("staticContent")
          );
        });

      expect(hasMissingStaticContentError).toBe(true);
    });

    it("should show an error for an invalid UI schema", () => {
      const invalidUiSchema: UiSchema = [
        {
          type: "field",
          definition: "test" as `/properties/${string}`,
        },
        {
          type: "field",
          definition: "/properties/test123!", // no special chars
        },
      ];

      const schemaErrors = validateUiSchema(invalidUiSchema);
      expect(Array.isArray(schemaErrors)).toBe(true);
      expect(schemaErrors && schemaErrors[0]?.instancePath).toMatch(
        "/0/definition",
      );
      expect(schemaErrors && schemaErrors[0]?.message).toMatch(
        // eslint-disable-next-line
        `must match pattern \"^/(properties|\\$defs)(/[a-zA-Z0-9_]+)+$\"`,
      );
      const hasTypeEnumError =
        Array.isArray(schemaErrors) &&
        schemaErrors.some((error) => {
          const instancePath =
            typeof error.instancePath === "string" ? error.instancePath : "";
          const message =
            typeof error.message === "string" ? error.message : "";
          return (
            (instancePath === "/0/type" || instancePath === "/0") &&
            message.includes("must be equal to one of the allowed values")
          );
        });

      expect(hasTypeEnumError).toBe(true);
    });

    it("should invalidate fieldList with section children", () => {
      const invalidUiSchema = [
        {
          type: "fieldList",
          label: "Test",
          name: "test",
          children: [
            {
              type: "section",
              label: "Bad",
              name: "bad",
              children: [],
            },
          ],
        },
      ] as unknown as UiSchema;

      const errors = validateUiSchema(invalidUiSchema);

      expect(Array.isArray(errors)).toBe(true);

      const hasFieldListChildrenError =
        Array.isArray(errors) &&
        errors.some((error) => {
          const instancePath =
            typeof error.instancePath === "string" ? error.instancePath : "";
          return instancePath.startsWith("/0/children/0");
        });

      expect(hasFieldListChildrenError).toBe(true);
    });

    it("should invalidate fieldList with a Table child", () => {
      const invalidUiSchema = [
        {
          type: "fieldList",
          label: "Test",
          name: "test",
          children: [
            {
              type: "multiField",
              name: "summary_table",
              widget: "Table",
              definition: ["/properties/first_value"],
              children: {
                columns: [
                  {
                    columnHeader: "Item",
                  },
                ],
                rows: [
                  {
                    cells: [
                      {
                        type: "plainText",
                        staticContent: "First Row",
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ] as unknown as UiSchema;

      const errors = validateUiSchema(invalidUiSchema);

      expect(Array.isArray(errors)).toBe(true);

      const hasFieldListTableError =
        Array.isArray(errors) &&
        errors.some((error) => {
          const instancePath =
            typeof error.instancePath === "string" ? error.instancePath : "";
          return instancePath.startsWith("/0/children/0");
        });

      expect(hasFieldListTableError).toBe(true);
    });
  });
});
