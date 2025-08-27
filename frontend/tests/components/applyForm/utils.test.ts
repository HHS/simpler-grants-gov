/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable testing-library/no-node-access */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { RJSFSchema } from "@rjsf/utils";
import sflllSchema from "tests/components/applyForm/sflll.mock.json";

import { UiSchema, UiSchemaField } from "src/components/applyForm/types";
import {
  buildWarningTree,
  condenseFormSchemaProperties,
  determineFieldType,
  flatFormDataToArray,
  formatFieldWarnings,
  getFieldConfig,
  getFieldNameForHtml,
  getFieldPathFromHtml,
  getFieldSchema,
  getFieldsForNav,
  getKeyParentPath,
  getNameFromDef,
  getRequiredProperties,
  getWarningsForField,
  isFieldRequired,
  jsonPathToPointer,
  jsonPointerToPath,
  processFormSchema,
  pruneEmptyNestedFields,
  shapeFormData,
  wrapSection,
} from "src/components/applyForm/utils";

const mockDereference = jest.fn();
const mockMergeAllOf = jest.fn();

jest.mock("@apidevtools/json-schema-ref-parser", () => ({
  dereference: () => mockDereference() as unknown,
}));

jest.mock("json-schema-merge-allof", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockMergeAllOf(...args) as unknown,
}));

describe("shapeFormData", () => {
  it("should shape form data to the form schema", () => {
    const shapedFormData = {
      name: "test",
      dob: "01/01/1900",
      address: "test street",
      state: "PA",
    };

    const formData = new FormData();
    formData.append("dob", "01/01/1900");
    formData.append("address", "test street");
    formData.append("name", "test");
    formData.append("state", "PA");

    const data = shapeFormData(formData, {});

    expect(data).toMatchObject(shapedFormData);
  });
  it("should shape nested form data", () => {
    const shapedFormData = {
      name: "test",
      dob: "01/01/1900",
      address: {
        street: "test street",
        zip: 1234,
        state: "XX",
        question: {
          rent: "yes",
        },
      },
      tasks: [
        {
          title: "Submit form",
          done: false,
        },
        {
          title: "Start form",
          done: true,
        },
      ],
      todos: ["email", "write"],
    };

    const tasks: Array<{ title: string; done: string }> = [
      { title: "Submit form", done: "false" },
      { title: "Start form", done: "true" },
    ];
    const formData = new FormData();

    formData.append("name", "test");
    formData.append("dob", "01/01/1900");
    formData.append("address--street", "test street");
    formData.append("address--state", "XX");
    formData.append("address--zip", "1234");
    formData.append("address--question--rent", "yes");

    tasks.forEach((obj, index) => {
      (Object.keys(obj) as Array<keyof typeof obj>).forEach((key) => {
        formData.append(`tasks[${index}]--${key}`, String(obj[key]));
      });
    });
    formData.append("todos[0]", "email");
    formData.append("todos[1]", "write");

    const data = shapeFormData(formData, {});
    expect(data).toMatchObject(shapedFormData);
  });
});

describe("getFieldConfig", () => {
  // TODO: should add tests around
  // * radio buttons
  // * multifield

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

// describe("getApplicationResponse", () => {
//   it("should return a structured response for valid input", () => {
//     const forms = [
//       {
//         application_form_id: "test",
//         application_id: "test",
//         application_form_status: "complete",
//         application_response: { test: "test" },
//         form_id: "test",
//       },
//     ] as ApplicationFormDetail[];

//     const result = getApplicationResponse(forms, "test");

//     expect(result).toEqual({ test: "test" });
//   });
// });

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

describe("getFieldSchema", () => {
  it("should return the schema for a single field with only a definition", () => {
    const formSchema: RJSFSchema = {
      type: "object",
      properties: {
        name: { type: "string", title: "Name", maxLength: 50 },
      },
    };

    const definition = "/properties/name";

    const result = getFieldSchema({ schema: {}, definition, formSchema });
    expect(result).toEqual({ type: "string", title: "Name", maxLength: 50 });
  });

  it("should merge the schema from the uiFieldObject with the form schema", () => {
    const formSchema: RJSFSchema = {
      type: "object",
      properties: {
        name: { type: "string", title: "Name", maxLength: 50 },
      },
    };

    const definition = "/properties/name";
    const schema = { title: "Custom Name", minLength: 5 };

    const result = getFieldSchema({ schema, definition, formSchema });
    expect(result).toEqual({
      type: "string",
      // overridden the beh uiFieldObject schema
      title: "Custom Name",
      maxLength: 50,
      // added from the uiFieldObject schema
      minLength: 5,
    });
  });
});

describe("pruneEmptyNestedFields", () => {
  it("returns flat object with undefined fields removed", () => {
    const flat = {
      thing: 1,
      another: "string",
      bad: undefined,
      stuff: [2, "hi"],
    };
    expect(pruneEmptyNestedFields(flat)).toEqual({
      thing: 1,
      another: "string",
      stuff: [2, "hi"],
    });
  });
  it("returns empty object if passed an empty object or object with only undefined fields", () => {
    const empty = {};
    expect(pruneEmptyNestedFields(empty)).toEqual(empty);
  });
  it("prunes all empty objects and objects containing only undefined properties", () => {
    const undefinedFields = {
      whatever: {
        again: { something: undefined },
        another: undefined,
        more: {},
      },
    };
    expect(pruneEmptyNestedFields(undefinedFields)).toEqual({});
  });
  it("removes nested objects containing only undefined properties or objects with only undefined properties", () => {
    expect(
      pruneEmptyNestedFields({
        thing: "stuff",
        another: {
          nested: {
            bad: undefined,
          },
        },
        keepMe: {
          here: {
            ok: "sure",
          },
          remove: {
            me: undefined,
          },
        },
      }),
    ).toEqual({
      thing: "stuff",
      keepMe: {
        here: {
          ok: "sure",
        },
      },
    });
  });
});

describe("getFieldNameForHtml", () => {
  it("returns correct field name based on definition, removing properties and adding delimiter", () => {
    expect(
      getFieldNameForHtml({
        definition: "/properties/something/properties/somethingElse",
      }),
    ).toEqual("something--somethingElse");
  });
  // this may not actually work
  it("returns correct field name based on schema", () => {
    expect(
      getFieldNameForHtml({
        schema: {
          title: "a bunch of stuff",
        },
      }),
    ).toEqual("a-bunch-of-stuff");

    expect(
      getFieldNameForHtml({
        schema: {},
      }),
    ).toEqual("untitled");
  });
});

describe("processFormSchema", () => {
  beforeEach(() => {
    mockDereference.mockResolvedValue({
      others: {
        just: "for fun",
      },
      properties: {
        dereferenced: "stuff",
        allOf: "things",
      },
    });
    mockMergeAllOf.mockImplementation(
      (processMe: { properties?: { allOf: unknown } }): unknown => {
        if (processMe.properties) {
          delete processMe.properties.allOf;
        }
        return processMe;
      },
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("calls the dereference function", async () => {
    await processFormSchema({});
    expect(mockDereference).toHaveBeenCalled();
  });
  it("calls allOf merge function", async () => {
    await processFormSchema({ properties: {} });
    expect(mockMergeAllOf).toHaveBeenCalledTimes(1);
  });
  it("returns the expected combination of values from the dereferenced and merged schemas", async () => {
    const processed = await processFormSchema({});
    expect(processed).toEqual({
      others: {
        just: "for fun",
      },
      properties: {
        dereferenced: "stuff",
      },
    });
  });
});

describe("condenseFormSchemaProperties", () => {
  const noProperties = {
    path: {
      thing: {
        cool: "value",
      },
      list: ["of", "stuff"],
    },
    secondary: 2,
  };
  it("leaves an object with no 'properties' unchanged", () => {
    expect(condenseFormSchemaProperties(noProperties)).toEqual(noProperties);
  });
  it("brings contents of 'properties' attributes up one level", () => {
    expect(
      condenseFormSchemaProperties({
        path: {
          properties: {
            thing: {
              cool: "value",
            },
            properties: {
              list: ["of", "stuff"],
            },
          },
        },
        properties: {
          secondary: 2,
        },
      }),
    ).toEqual(noProperties);
  });
});

describe("getRequiredProperties", () => {
  it("returns an empty array for a schema with no required fields", () => {
    expect(
      getRequiredProperties({
        properties: {
          something: {
            type: "string",
          },
        },
      }),
    ).toEqual([]);
  });
  it("returns a list of all unconditionally required property paths within a schema", () => {
    expect(getRequiredProperties(sflllSchema as RJSFSchema)).toEqual([
      "federal_action_type",
      "federal_action_status",
      "report_type",
      "reporting_entity/entity_type",
      "reporting_entity/applicant_reporting_entity/organization_name",
      "reporting_entity/applicant_reporting_entity/address/street1",
      "reporting_entity/applicant_reporting_entity/address/city",
      "federal_agency_department",
      "lobbying_registrant/individual/first_name",
      "lobbying_registrant/individual/last_name",
      "individual_performing_service/individual/first_name",
      "individual_performing_service/individual/last_name",
      "signature_block/name/first_name",
      "signature_block/name/last_name",
    ]);
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
  // eslint-disable-next-line
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

describe("flatFormDataToArray", () => {
  it("returns array with single value if field exists directly", () => {
    const data = { foo: "bar" };
    expect(flatFormDataToArray("foo", data)).toEqual([{ foo: "bar" }]);
  });

  it("returns array of objects for indexed keys", () => {
    const data = {
      "tasks[0].title": "Task 1",
      "tasks[1].title": "Task 2",
    };
    expect(flatFormDataToArray("tasks", data)).toEqual([
      { title: "Task 1" },
      { title: "Task 2" },
    ]);
  });

  it("returns empty array if field not present", () => {
    const data = { something: 123 };
    expect(flatFormDataToArray("notfound", data)).toEqual([]);
  });

  it("handles sparse arrays", () => {
    const data = {
      "items[2].name": "third",
      "items[0].name": "first",
    };
    expect(flatFormDataToArray("items", data)).toEqual([
      { name: "first" },
      undefined,
      { name: "third" },
    ]);
  });

  it("ignores falsy values", () => {
    const data = {
      "arr[0].val": null,
      "arr[1].val": undefined,
      "arr[2].val": "ok",
    };

    expect(flatFormDataToArray("arr", data)).toEqual([
      undefined,
      undefined,
      { val: "ok" },
    ]);
  });
});

describe("getFieldPathFromHtml", () => {
  it("converts field name to JSON pointer path", () => {
    expect(getFieldPathFromHtml("foo--bar")).toBe("/foo/bar");
  });
});

describe("jsonPathToPointer", () => {
  it("converts JSON path to pointer", () => {
    expect(jsonPathToPointer("$.foo.bar")).toBe(
      "/properties/foo/properties/bar",
    );
  });
});

describe("jsonPointerToPath", () => {
  it("converts pointer to JSON path", () => {
    expect(jsonPointerToPath("/properties/foo/properties/bar")).toBe(
      "$.foo.bar",
    );
  });
});

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

describe("wrapSection", () => {
  it("returns a FieldsetWidget element", () => {
    const tree = <div>Test</div>;
    const el = wrapSection({ label: "Label", fieldName: "field", tree });
    expect(el.props.label).toBe("Label");
    expect(el.props.fieldName).toBe("field");
    expect(el.props.children).toBe(tree);
  });
});

describe("getFieldsForNav", () => {
  it("returns nav items for schema", () => {
    const schema = [
      { name: "section1", type: "section", label: "Section 1", children: [] },
      { name: "section2", type: "section", label: "Section 2", children: [] },
    ] as UiSchema;
    expect(getFieldsForNav(schema)).toEqual([
      { href: "form-section-section1", text: "Section 1" },
      { href: "form-section-section2", text: "Section 2" },
    ]);
  });
  it("returns empty array for non-array input", () => {
    expect(getFieldsForNav({} as never)).toEqual([]);
  });
});

describe("getKeyParentPath", () => {
  it("returns combined and cleaned path", () => {
    expect(getKeyParentPath("foo", "parent/properties")).toBe("parent/foo");
  });
  it("returns key if no parent", () => {
    expect(getKeyParentPath("foo")).toBe("foo");
  });
});

describe("isFieldRequired", () => {
  it("returns true if definition is in requiredFields", () => {
    expect(isFieldRequired("/properties/foo", ["foo"])).toBe(true);
  });
  it("returns false if not required", () => {
    expect(isFieldRequired("/properties/bar", ["foo"])).toBe(false);
  });
  it("handles array of definitions", () => {
    expect(
      isFieldRequired(["/properties/foo", "/properties/bar"], ["bar"]),
    ).toBe(true);
  });
});

describe("buildWarningTree", () => {
  it("returns formatted warnings for matching fields", () => {
    const formUiSchema = [
      {
        type: "field" as const,
        definition: "/properties/name" as const,
        schema: { title: "Name", type: "string" },
      },
      {
        type: "field" as const,
        definition: "/properties/email" as const,
        schema: { title: "Email", type: "string" },
      },
    ];
    const formValidationWarnings = [
      {
        field: "$.name",
        message: "Name is required",
        formatted: "Name is required",
        htmlField: "name",
        type: "required",
        value: "",
        definition: "/properties/name",
      },
      {
        field: "$.email",
        message: "Email is invalid",
        formatted: "Email is invalid",
        htmlField: "email",
        type: "format",
        value: "",
        definition: "/properties/email",
      },
    ];
    const formSchema = {
      type: "object" as const,
      properties: {
        name: { type: "string" as const, title: "Name" },
        email: { type: "string" as const, title: "Email" },
      },
    };
    const result = buildWarningTree(
      formUiSchema,
      formValidationWarnings,
      formSchema,
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "$.name",
          formatted: "Name is required",
        }),
        expect.objectContaining({
          field: "$.email",
          formatted: "Email is invalid",
        }),
      ]),
    );
  });

  it("returns empty array if no matching warnings", () => {
    const formUiSchema = [
      {
        type: "field" as const,
        definition: "/properties/age" as const,
        schema: { title: "Age", type: "number" },
      },
    ];
    const formValidationWarnings = [
      {
        field: "$.name",
        message: "Name is required",
        formatted: "Name is required",
        htmlField: "name",
        type: "required",
        value: "",
        definition: "/properties/name",
      },
    ];
    const formSchema = {
      type: "object" as const,
      properties: {
        age: { type: "number" as const, title: "Age" },
      },
    };
    const result = buildWarningTree(
      formUiSchema,
      formValidationWarnings,
      formSchema,
    );
    expect(result).toEqual([]);
  });
});
