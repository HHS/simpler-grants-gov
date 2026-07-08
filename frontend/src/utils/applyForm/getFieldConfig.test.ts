import { RJSFSchema } from "@rjsf/utils";
import { identity } from "lodash";
import {
  UiSchemaField,
  UiSchemaFieldList,
  UiSchemaTableMultiField,
} from "src/types/applyForm/types";
import {
  buildFieldListBaseId,
  determineFieldType,
  getBasicMultifieldInfo,
  getEnumOptions,
  getFieldConfig,
  getNameFromDef,
  getWarningsForField,
} from "src/utils/applyForm/getFieldConfig";
import { fakeValidationError } from "src/utils/testing/fixtures";

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

  it("returns required warnings that reference the field's parent paths", () => {
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

    expect(determineFieldType({ uiFieldObject, fieldSchema })).toEqual("Text");

    expect(
      determineFieldType({
        uiFieldObject,
        fieldSchema: {
          ...fieldSchema,
          enum: ["test"],
        },
      }),
    ).toEqual("Select");

    expect(
      determineFieldType({
        uiFieldObject,
        fieldSchema: {
          ...fieldSchema,
          type: "boolean",
        },
      }),
    ).toEqual("Checkbox");

    expect(
      determineFieldType({
        uiFieldObject,
        fieldSchema: {
          ...fieldSchema,
          maxLength: 256,
        },
      }),
    ).toEqual("TextArea");
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

    const { type, props } = getFieldConfig({
      uiFieldObject,
      formSchema,
      errors: null,
      formData: { name: "Jane Doe" },
      requiredField: true,
    });

    expect(type).toEqual("Text");
    expect(props).toEqual({
      id: "name",
      key: "name",
      disabled: false,
      required: true,
      maxLength: 50,
      minLength: undefined,
      schema: { type: "string", title: "Name", maxLength: 50 },
      rawErrors: [],
      value: "Jane Doe",
      options: {},
      uiSchemaField: uiFieldObject,
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

    const { type, props } = getFieldConfig({
      uiFieldObject,
      formSchema,
      errors,
      formData: { email: "invalid-email" },
      requiredField: false,
    });

    expect(type).toEqual("Text");
    expect(props).toEqual({
      id: "email",
      key: "email",
      disabled: false,
      required: false,
      maxLength: undefined,
      minLength: undefined,
      schema: { type: "string", title: "Email" },
      rawErrors: ["Invalid email format"],
      value: "invalid-email",
      options: {},
      uiSchemaField: uiFieldObject,
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

    const { type, props } = getFieldConfig({
      uiFieldObject,
      formSchema,
      errors: null,
      formData: {
        pickOneOfTheOptions: "first option",
      },
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
      uiSchemaField: uiFieldObject,
    });
  });

  describe("buildFieldListBaseId", () => {
    it("builds a base id for a flat FieldList child field", () => {
      expect(
        buildFieldListBaseId({
          fieldListName: "contacts",
          storagePath: ["firstName"],
        }),
      ).toBe("contacts[~~index~~]--firstName");
    });

    it("builds a base id for a nested FieldList child field", () => {
      expect(
        buildFieldListBaseId({
          fieldListName: "contacts",
          storagePath: ["address", "street1"],
        }),
      ).toBe("contacts[~~index~~]--address--street1");
    });
  });

  describe("fieldList", () => {
    const formSchema: RJSFSchema = {
      type: "object",
      properties: {
        contacts: {
          type: "array",
          items: {
            type: "object",
            required: ["firstName"],
            properties: {
              firstName: { type: "string", title: "First Name" },
              address: {
                type: "object",
                properties: {
                  street1: { type: "string", title: "Street 1" },
                },
              },
            },
          },
        },
        docs: { type: "array", items: { type: "string", format: "uuid" } },
      },
    };

    it("returns FieldList config for a fieldList node", () => {
      const uiFieldObject: UiSchemaFieldList = {
        type: "fieldList",
        name: "contacts",
        label: "Contacts",
        children: [
          {
            type: "field",
            definition: "/properties/contacts/items/properties/firstName",
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
        throw new Error("Expected FieldList");
      }

      expect(result.props.groupDefinition).toHaveLength(1);
      expect(result.props.groupDefinition[0].widget).toBe("Text");
      expect(result.props.groupDefinition[0].baseId).toBe(
        "contacts[~~index~~]--firstName",
      );
      expect(result.props.groupDefinition[0].storagePath).toEqual([
        "firstName",
      ]);
    });

    it("returns nested storagePath and baseId for nested FieldList child fields", () => {
      const uiFieldObject: UiSchemaFieldList = {
        type: "fieldList",
        name: "contacts",
        label: "Contacts",
        children: [
          {
            type: "field",
            definition:
              "/properties/contacts/items/properties/address/properties/street1",
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
        throw new Error("Expected FieldList");
      }

      expect(result.props.groupDefinition).toHaveLength(1);
      expect(result.props.groupDefinition[0].widget).toBe("Text");
      expect(result.props.groupDefinition[0].baseId).toBe(
        "contacts[~~index~~]--address--street1",
      );
      expect(result.props.groupDefinition[0].storagePath).toEqual([
        "address",
        "street1",
      ]);
    });

    it("throws if fieldList contains unsupported node types", () => {
      const uiFieldObject = {
        type: "fieldList",
        name: "contacts",
        label: "Contacts",
        children: [
          {
            type: "section",
            name: "bad",
            label: "Bad",
            children: [],
          },
        ],
      } as unknown as UiSchemaFieldList;

      expect(() =>
        getFieldConfig({
          errors: null,
          formSchema,
          formData: {},
          uiFieldObject,
          requiredField: false,
        }),
      ).toThrow("fieldList children must be field nodes");
    });

    it("throws for nested fieldList", () => {
      const uiFieldObject = {
        type: "fieldList",
        name: "outer",
        label: "Outer",
        children: [
          {
            type: "fieldList",
            name: "inner",
            label: "Inner",
            children: [],
          },
        ],
      } as unknown as UiSchemaFieldList;

      expect(() =>
        getFieldConfig({
          errors: null,
          formSchema,
          formData: {},
          uiFieldObject,
          requiredField: false,
        }),
      ).toThrow();
    });
  });

  describe("table", () => {
    const formSchema: RJSFSchema = {
      type: "object",
      properties: {
        personnel_federal_share: {
          type: "number",
          title: "Personnel Federal Share",
        },
        personnel_non_federal_share: {
          type: "number",
          title: "Personnel Non-Federal Share",
          readOnly: true,
        },
      },
    };

    const tableUiSchema: UiSchemaTableMultiField = {
      type: "multiField",
      name: "budget_summary_table",
      widget: "Table",
      definition: [
        "/properties/personnel_federal_share",
        "/properties/personnel_non_federal_share",
      ],
      children: {
        columns: [
          {
            columnHeader: "Category",
            width: 40,
          },
          {
            columnHeader: "Federal Share",
            width: 30,
          },
          {
            columnHeader: "Non-Federal Share",
            width: 30,
          },
        ],
        rows: [
          {
            cells: [
              {
                type: "plainText",
                staticContent: "Personnel",
              },
              {
                type: "input",
                definition: "/properties/personnel_federal_share",
              },
              {
                type: "readOnly",
                definition: "/properties/personnel_non_federal_share",
              },
            ],
          },
        ],
      },
    };

    it("returns normal multiField config with Table UI-schema metadata", () => {
      const result = getFieldConfig({
        errors: null,
        formSchema,
        formData: {
          personnel_federal_share: 2500,
          personnel_non_federal_share: 1000,
        },
        uiFieldObject: tableUiSchema,
        requiredField: false,
      });

      expect(result.type).toBe("Table");

      if (result.type !== "Table") {
        throw new Error("Expected Table");
      }

      expect(result.props).toEqual({
        id: "budget_summary_table",
        key: "budget_summary_table",
        disabled: false,
        required: false,
        minLength: undefined,
        maxLength: undefined,
        schema: {
          type: "number",
          title: "Personnel Non-Federal Share",
          readOnly: true,
        },
        rawErrors: [],
        value: {},
        options: {},
        uiSchemaField: tableUiSchema,
      });
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

  it("handles array field type with tuple items", () => {
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

  it("handles array field type with a single item schema", () => {
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
          type: "multiField",
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
          type: "multiField",
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
