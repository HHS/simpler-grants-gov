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

import { UiSchemaField } from "src/components/applyForm/types";

const mockGetSimpleTranslationsSync = jest.fn().mockImplementation(identity);

jest.mock("src/i18n/getMessagesSync", () => ({
  getSimpleTranslationsSync: ({
    translateableString,
  }: {
    translateableString: string;
  }) => mockGetSimpleTranslationsSync(translateableString) as unknown,
}));

describe("getNameFromDef", () => {
  it("gets name from definition", () => {
    expect(
      getNameFromDef({ definition: "/properties/foo", schema: undefined }),
    ).toBe("foo");
  });
  it("gets name from schema title", () => {
    expect(
      getNameFromDef({ definition: undefined, schema: { title: "My Field" } }),
    ).toBe("My-Field");
  });
  it("returns 'untitled' if no info", () => {
    expect(getNameFromDef({ definition: undefined, schema: {} })).toBe(
      "untitled",
    );
  });
});

describe("getWarningsForField", () => {
  it("returns an empty array if there are not any warnings", () => {
    expect(
      getWarningsForField({
        errors: [],
        fieldName: "$.field_name",
        fieldType: "string",
        definition: "/properties/field_name",
      }),
    ).toEqual([]);
    expect(
      getWarningsForField({
        errors: null,
        fieldName: "$.field_name",
        definition: "/properties/field_name",
        fieldType: "string",
      }),
    ).toEqual([]);
  });

  it.skip("does something with arrays?", () => {});
  it("returns warnings that directly reference the field name", () => {
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
        ],
        fieldName: "field_name",
        definition: "/properties/field_name",
        fieldType: "string",
      }),
    ).toEqual(["something went wrong"]);
  });
  it("if a field is required, returns `required` warnings that reference the field's parent paths", () => {
    expect(
      getWarningsForField({
        errors: [
          {
            field: "$.parent.field_name",
            message: "parent is required",
            formatted: "parent is required",
            htmlField: "parent--field_name",
            type: "required",
            value: "not sure",
            definition: "/properties/parent/properties/field_name",
          },
        ],
        fieldName: "field_name",
        definition: "/properties/parent/properties/field_name",
        fieldType: "string",
      }),
    ).toEqual(["parent is required"]);
  });
});

describe("determineFieldType", () => {
  it("should return proper fields", () => {
    const uiFieldObject: UiSchemaField = {
      type: "field",
      definition: "/properties/test",
    };
    const fieldSchema: RJSFSchema = {
      type: "string" as const,
      title: "test",
    };
    const textField = determineFieldType({ uiFieldObject, fieldSchema });
    expect(textField).toEqual("Text");
    const selectFieldSchema: RJSFSchema = {
      ...fieldSchema,
      enum: ["test"],
    };
    const selectField = determineFieldType({
      uiFieldObject,
      fieldSchema: selectFieldSchema,
    });
    expect(selectField).toEqual("Select");
    const checkboxFieldSchema: RJSFSchema = {
      ...fieldSchema,
      type: "boolean",
    };
    const checkboxField = determineFieldType({
      uiFieldObject,
      fieldSchema: checkboxFieldSchema,
    });
    expect(checkboxField).toEqual("Checkbox");
    const textAreaFieldSchema: RJSFSchema = {
      ...fieldSchema,
      maxLength: 256,
    };
    const textAreaField = determineFieldType({
      uiFieldObject,
      fieldSchema: textAreaFieldSchema,
    });
    expect(textAreaField).toEqual("TextArea");
  });
});

describe("getFieldConfig", () => {
  it("should build a config with basic properties", () => {
    const uiFieldObject: UiSchemaField = {
      type: "field",
      definition: "/properties/name",
      schema: {
        type: "string",
        title: "Name",
        maxLength: 50,
      },
    };

    const formSchema: RJSFSchema = {
      type: "object",
      properties: {
        name: { type: "string", title: "Name", maxLength: 50 },
      },
      required: ["name"],
    };

    const errors = null;
    const formData = { name: "Jane Doe" };

    const { type, props } = getFieldConfig({
      uiFieldObject,
      formSchema,
      errors,
      formData,
      requiredField: true,
    });

    expect(type).toEqual("Text");
    expect(props).toEqual({
      id: "name",
      key: "name",
      disabled: false,
      required: true,
      maxLength: 50,
      schema: { type: "string", title: "Name", maxLength: 50 },
      rawErrors: [],
      value: "Jane Doe",
      options: {},
    });
  });

  it("should handle fields with errors", () => {
    const uiFieldObject: UiSchemaField = {
      type: "field",
      definition: "/properties/email",
    };

    const formSchema: RJSFSchema = {
      type: "object",
      properties: {
        email: { type: "string", title: "Email" },
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

    const formData = { email: "invalid-email" };

    const { type, props } = getFieldConfig({
      uiFieldObject,
      formSchema,
      errors,
      formData,
      requiredField: false,
    });

    expect(type).toEqual("Text");
    expect(props).toEqual({
      id: "email",
      key: "email",
      disabled: false,
      required: false,
      schema: { type: "string", title: "Email" },
      rawErrors: ["Invalid email format"],
      value: "invalid-email",
      options: {},
    });
  });

  it("should handle field types with options", () => {
    const uiFieldObject: UiSchemaField = {
      type: "field",
      definition: "/properties/pickOneOfTheOptions",
    };

    const formSchema: RJSFSchema = {
      type: "object",
      properties: {
        pickOneOfTheOptions: {
          type: "string",
          title: "select field",
          enum: ["first option", "second option"],
        },
      },
    };

    const errors = null;
    const formData = {
      pickOneOfTheOptions: "first option",
    };

    const { type, props } = getFieldConfig({
      uiFieldObject,
      formSchema,
      errors,
      formData,
      requiredField: false,
    });

    expect(type).toEqual("Select");
    expect(props).toEqual({
      id: "pickOneOfTheOptions",
      key: "pickOneOfTheOptions",
      disabled: false,
      required: false,
      schema: {
        type: "string",
        title: "select field",
        enum: ["first option", "second option"],
      },
      rawErrors: [],
      value: "first option",
      maxLength: undefined,
      minLength: undefined,
      options: {
        enumOptions: [
          { label: "first option", value: "first option" },
          {
            label: "second option",
            value: "second option",
          },
        ],
        emptyValue: "- Select -",
      },
    });
  });
});

describe("getEnumOptions", () => {
  it("returns empty object if widget type does not support an enum option", () => {
    expect(getEnumOptions({ widgetType: "Text", fieldSchema: {} })).toEqual({});
  });
  it("returns correct enum for boolean field", () => {
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
  });
  it("handles array field type (multiple items)", () => {
    expect(
      getEnumOptions({
        widgetType: "MultiSelect",
        fieldSchema: {
          type: "array",
          items: [
            { enum: ["option one", "option two"] },
            { enum: ["ignore me"] },
          ],
        },
      }),
    ).toEqual({
      enumOptions: [
        { value: "option one", label: "option one" },
        { value: "option two", label: "option two" },
      ],
    });
  });

  it("handles array field type (single item)", () => {
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
  });

  it("handles object field type", () => {
    expect(
      getEnumOptions({
        widgetType: "MultiSelect",
        fieldSchema: {
          type: "object",
          enum: ["option one", "option two"],
        },
      }),
    ).toEqual({
      enumOptions: [
        { value: "option one", label: "option one" },
        { value: "option two", label: "option two" },
      ],
    });
  });

  it("adds placeholder value for select array field type", () => {
    expect(
      getEnumOptions({
        widgetType: "Select",
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
      emptyValue: "- Select -",
    });
  });

  it("does not error on malformed field schema enum", () => {
    expect(
      getEnumOptions({
        widgetType: "MultiSelect",
        fieldSchema: {
          type: "array",
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          items: { enum: { option_one: "option two" } },
        },
      }),
    ).toEqual({
      enumOptions: [],
    });
  });
});

describe("getBasicMultifieldInfo", () => {
  it("errors on non-multifield schema", () => {
    expect(() =>
      getBasicMultifieldInfo({
        uiFieldObject: {
          definition: "/properties/not-an-array",
          type: "multiField", // note that this function doesn't assert on type
          name: "name",
        },
        formSchema: {},
        formData: {},
        errors: [],
      }),
    ).toThrow();
  });
  it("errors on missing name", () => {
    expect(() =>
      getBasicMultifieldInfo({
        uiFieldObject: {
          definition: ["/properties/not-an-array"],
          type: "multiField", // note that this function doesn't assert on type
        },
        formSchema: {},
        formData: {},
        errors: [],
      }),
    ).toThrow();
  });
  it("handles basic schema case", () => {
    const expected = {
      value: {
        nested_field_one: "value one",
        nested_field_two: "value two",
      },
      // note that the current logic clobbers the first nested field entirely see https://github.com/HHS/simpler-grants-gov/issues/8624
      fieldSchema: {
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
      rawErrors: [{ ...fakeValidationError }],
      fieldName: "test multifield",
      htmlFieldName: "",
    };

    expect(
      getBasicMultifieldInfo({
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
      }),
    ).toEqual(expected);
  });
});
