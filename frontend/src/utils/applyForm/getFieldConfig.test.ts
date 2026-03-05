import { RJSFSchema } from "@rjsf/utils";
import { identity } from "lodash";
import {
  determineFieldType,
  getBasicMultifieldInfo,
  getEnumOptions,
  getFieldConfig,
  getNameFromDef,
  getWarningsForField,
} from "src/utils/applyForm/getFieldConfig";
import { fakeValidationError } from "src/utils/testing/fixtures";

import {
  UiSchemaField,
  UiSchemaFieldList,
} from "src/components/applyForm/types";

const mockGetSimpleTranslationsSync = jest.fn().mockImplementation(identity);

jest.mock("src/i18n/getMessagesSync", () => ({
  getSimpleTranslationsSync: ({
    translateableString,
  }: {
    translateableString: string;
  }) => mockGetSimpleTranslationsSync(translateableString) as unknown,
}));

describe("getFieldConfig + helpers", () => {
  describe("getNameFromDef", () => {
    it("prefers definition, falls back to schema title, else 'untitled'", () => {
      expect(
        getNameFromDef({ definition: "/properties/foo", schema: undefined }),
      ).toBe("foo");

      expect(
        getNameFromDef({
          definition: undefined,
          schema: { title: "My Field" },
        }),
      ).toBe("My-Field");
      expect(getNameFromDef({ definition: undefined, schema: {} })).toBe(
        "untitled",
      );
    });
  });

  describe("getWarningsForField", () => {
    it("returns [] when no errors, and maps formatted/message for matching definitions", () => {
      expect(
        getWarningsForField({
          errors: null,
          fieldName: "field_name",
          fieldType: "string",
          definition: "/properties/field_name",
        }),
      ).toEqual([]);
      expect(
        getWarningsForField({
          errors: [],
          fieldName: "field_name",
          fieldType: "string",
          definition: "/properties/field_name",
        }),
      ).toEqual([]);

      expect(
        getWarningsForField({
          errors: [
            {
              field: "$.field_name",
              message: "something went wrong",
              formatted: "something went wrong",
              htmlField: "field_name",
              type: "generic",
              value: "not sure",
              definition: "/properties/field_name",
            },
            {
              field: "$.other",
              message: "ignore me",
              type: "generic",
              value: "x",
              definition: "/properties/other",
            },
          ],
          fieldName: "field_name",
          fieldType: "string",
          definition: "/properties/field_name",
        }),
      ).toEqual(["something went wrong"]);
    });
  });

  describe("determineFieldType", () => {
    const uiFieldObject: UiSchemaField = {
      type: "field",
      definition: "/properties/test",
    };

    it("uses uiFieldObject.widget override when provided", () => {
      const override: UiSchemaField = {
        ...uiFieldObject,
        widget: "Radio",
      };
      expect(
        determineFieldType({
          uiFieldObject: override,
          fieldSchema: { type: "string", title: "test" },
        }),
      ).toBe("Radio");
    });

    it("infers common types (attachment, enums, boolean, textarea, arrays)", () => {
      expect(
        determineFieldType({
          uiFieldObject,
          fieldSchema: { type: "string", format: "uuid" },
        }),
      ).toBe("Attachment");

      expect(
        determineFieldType({
          uiFieldObject,
          fieldSchema: { type: "string", enum: ["a", "b"] },
        }),
      ).toBe("Select");

      expect(
        determineFieldType({
          uiFieldObject,
          fieldSchema: { type: "boolean" },
        }),
      ).toBe("Checkbox");

      expect(
        determineFieldType({
          uiFieldObject,
          fieldSchema: { type: "string", maxLength: 256 },
        }),
      ).toBe("TextArea");

      expect(
        determineFieldType({
          uiFieldObject,
          fieldSchema: {
            type: "array",
            items: { type: "string", enum: ["x", "y"] },
          },
        }),
      ).toBe("MultiSelect");

      expect(
        determineFieldType({
          uiFieldObject,
          fieldSchema: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
        }),
      ).toBe("AttachmentArray");
    });
  });

  describe("getEnumOptions", () => {
    it("returns {} for non-enum widgets; supports boolean, enum arrays, and select emptyValue", () => {
      expect(getEnumOptions({ widgetType: "Text", fieldSchema: {} })).toEqual(
        {},
      );

      expect(
        getEnumOptions({
          widgetType: "Radio",
          fieldSchema: { type: "boolean" },
        }),
      ).toEqual({
        enumOptions: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ],
      });

      expect(
        getEnumOptions({
          widgetType: "MultiSelect",
          fieldSchema: {
            type: "array",
            items: { enum: ["option one", "option two"] },
          },
        }),
      ).toEqual({
        enumOptions: [
          { value: "option one", label: "option one" },
          { value: "option two", label: "option two" },
        ],
      });

      expect(
        getEnumOptions({
          widgetType: "Select",
          fieldSchema: { type: "array", items: { enum: ["a", "b"] } },
        }),
      ).toEqual({
        enumOptions: [
          { value: "a", label: "a" },
          { value: "b", label: "b" },
        ],
        emptyValue: "- Select -",
      });

      // malformed enum should not throw
      expect(
        getEnumOptions({
          widgetType: "MultiSelect",
          fieldSchema: {
            type: "array",
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            items: { enum: { option_one: "bad" } },
          },
        }),
      ).toEqual({ enumOptions: [] });
    });
  });

  describe("getFieldConfig", () => {
    it("builds a basic field config (incl disabled/required/errors/options)", () => {
      const uiFieldObject: UiSchemaField = {
        type: "field",
        definition: "/properties/email",
      };

      const formSchema: RJSFSchema = {
        type: "object",
        properties: {
          email: {
            type: "string",
            title: "Email",
            enum: ["first option", "second option"],
          },
        },
      };

      const errors = [
        {
          field: "$.email",
          message: "'invalid' email format",
          type: "",
          value: "",
          htmlField: "email",
          formatted: "Invalid email format",
          definition: "/properties/email",
        },
      ];

      const result = getFieldConfig({
        uiFieldObject,
        formSchema,
        errors,
        formData: { email: "first option" },
        requiredField: true,
      });

      expect(result.type).toBe("Select");
      if (result.type === "FieldList") {
        throw new Error("Expected non-FieldList widget");
      }

      expect(result.props).toMatchObject({
        id: "email",
        key: "email",
        disabled: false,
        required: true,
        schema: {
          type: "string",
          title: "Email",
          enum: ["first option", "second option"],
        },
        rawErrors: ["Invalid email format"],
        value: "first option",
      });

      expect(result.props.options).toMatchObject({
        enumOptions: [
          { label: "first option", value: "first option" },
          { label: "second option", value: "second option" },
        ],
      });
    });
  });

  describe("fieldList", () => {
    const formSchema: RJSFSchema = {
      type: "object",
      properties: {
        firstName: { type: "string", title: "First Name" },
        docs: { type: "array", items: { type: "string", format: "uuid" } },
      },
    };

    it("builds FieldList config with groupDefinition/generalProps and schema", () => {
      const uiFieldObject: UiSchemaFieldList = {
        type: "fieldList",
        name: "contacts",
        label: "Contacts",
        description: "A list of contacts",
        defaultSize: 1,
        children: [
          {
            type: "field",
            definition: "/properties/firstName",
            schema: { title: "First Name", type: "string" },
          },
          {
            type: "field",
            definition: "/properties/docs",
            schema: { title: "Docs", type: "array" },
            widget: "AttachmentArray",
          },
        ],
      };

      const result = getFieldConfig({
        errors: null,
        formSchema,
        formData: {},
        uiFieldObject,
        requiredField: false,
      });

      expect(result.type).toBe("FieldList");
      if (result.type !== "FieldList") {
        throw new Error("Expected FieldList result");
      }

      expect(result.props).toMatchObject({
        id: "contacts",
        key: "contacts",
        label: "Contacts",
        description: "A list of contacts",
        defaultSize: 1,
        schema: {
          type: "array",
          title: "Contacts",
          description: "A list of contacts",
        },
      });

      expect(result.props.groupDefinition).toHaveLength(2);

      const [first, second] = result.props.groupDefinition;

      expect(first.widget).toBe("Text");
      expect(first.baseId).toContain("contacts[~~index~~]");
      expect(first.generalProps).toHaveProperty("schema");
      expect(first.generalProps).not.toHaveProperty("id");
      expect(first.generalProps).not.toHaveProperty("value");
      expect(first.generalProps).not.toHaveProperty("key");

      expect(second.widget).toBe("AttachmentArray");
      expect(second.baseId).toContain("contacts[~~index~~]");
      expect(second.generalProps).toHaveProperty("schema");
      expect(second.generalProps).not.toHaveProperty("id");
      expect(second.generalProps).not.toHaveProperty("value");
      expect(second.generalProps).not.toHaveProperty("key");
    });

    it("throws when fieldList has non-field children (including nested fieldList)", () => {
      const badUiFieldObject = {
        type: "fieldList",
        name: "contacts",
        label: "Contacts",
        defaultSize: 1,
        children: [
          {
            type: "fieldList",
            name: "inner",
            label: "Inner",
            defaultSize: 1,
            children: [],
          },
        ],
      } as unknown as UiSchemaFieldList;

      expect(() =>
        getFieldConfig({
          errors: null,
          formSchema,
          formData: {},
          uiFieldObject: badUiFieldObject,
          requiredField: false,
        }),
      ).toThrow(/fieldList children must be field nodes/);
    });
  });

  describe("getBasicMultifieldInfo", () => {
    it("throws on non-array definition or missing name; otherwise returns merged value + rawErrors", () => {
      expect(() =>
        getBasicMultifieldInfo({
          uiFieldObject: {
            definition: "/properties/not-an-array",
            type: "multiField",
            name: "name",
          },
          formSchema: {},
          formData: {},
          errors: [],
        }),
      ).toThrow();

      expect(() =>
        getBasicMultifieldInfo({
          uiFieldObject: {
            definition: ["/properties/field_one"],
            type: "multiField",
          },
          formSchema: {},
          formData: {},
          errors: [],
        }),
      ).toThrow();

      const result = getBasicMultifieldInfo({
        uiFieldObject: {
          definition: ["/properties/field_one", "/properties/field_two"],
          name: "test multifield",
          type: "multiField",
        },
        formSchema: {
          properties: {
            field_one: {
              properties: {
                nested_field_one: {
                  type: "string",
                  title: "field one",
                  description: "description one",
                  minLength: 0,
                  maxLength: 50,
                },
              },
            },
            field_two: {
              properties: {
                nested_field_two: {
                  type: "string",
                  title: "field two",
                  description: "description two",
                  minLength: 0,
                  maxLength: 5,
                },
              },
            },
          },
        },
        formData: {
          field_one: { nested_field_one: "value one" },
          field_two: { nested_field_two: "value two" },
        },
        errors: [fakeValidationError],
      });

      expect(result.fieldName).toBe("test multifield");
      expect(result.value).toMatchObject({
        nested_field_one: "value one",
        nested_field_two: "value two",
      });
      expect(result.rawErrors).toEqual([{ ...fakeValidationError }]);
    });
  });
});
