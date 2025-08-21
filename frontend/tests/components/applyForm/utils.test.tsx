import { RJSFSchema } from "@rjsf/utils";
import { render, screen } from "@testing-library/react";
import sflllSchema from "tests/components/applyForm/sflll.mock.json";

import { UiSchema, UiSchemaField } from "src/components/applyForm/types";
import {
  buildField,
  buildFormTreeRecursive,
  condenseFormSchemaProperties,
  determineFieldType,
  getFieldName,
  getFieldSchema,
  getRequiredProperties,
  processFormSchema,
  pruneEmptyNestedFields,
  shapeFormData,
} from "src/components/applyForm/utils";

type FormActionArgs = [
  {
    applicationId: string;
    formId: string;
    formData: FormData;
    saved: boolean;
    error: boolean;
  },
  FormData,
];

type FormActionResult = Promise<{
  applicationId: string;
  formId: string;
  saved: boolean;
  error: boolean;
  formData: FormData;
}>;

const mockHandleFormAction = jest.fn<FormActionResult, FormActionArgs>();
const mockRevalidateTag = jest.fn<void, [string]>();
const getSessionMock = jest.fn();
const mockDereference = jest.fn();
const mockMergeAllOf = jest.fn();

jest.mock("src/components/applyForm/actions", () => ({
  handleFormAction: (...args: [...FormActionArgs]) =>
    mockHandleFormAction(...args),
}));

jest.mock("next/cache", () => ({
  revalidateTag: (tag: string) => mockRevalidateTag(tag),
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useCallback: (fn: unknown) => fn,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

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

describe("buildField", () => {
  it("should build a field with basic properties", () => {
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

    const BuiltField = buildField({
      uiFieldObject,
      formSchema,
      errors,
      formData,
    });
    render(BuiltField);

    const label = screen.getByTestId("label");
    expect(label).toHaveAttribute("for", "name");
    expect(label).toHaveAttribute("id", "label-for-name");

    const required = screen.getByText("*");
    expect(required).toBeInTheDocument();

    const field = screen.getByTestId("name");
    expect(field).toBeInTheDocument();
    expect(field).toBeRequired();
    expect(field).toHaveAttribute("type", "text");
    expect(field).toHaveAttribute("maxLength", "50");
    expect(field).toHaveValue("Jane Doe");
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
        message: "Invalid email format",
        type: "",
        value: "",
      },
    ];

    const formData = { email: "invalid-email" };

    const BuiltField = buildField({
      uiFieldObject,
      formSchema,
      errors,
      formData,
    });
    render(BuiltField);

    const label = screen.getByTestId("label");
    expect(label).toHaveAttribute("for", "email");
    expect(label).toHaveAttribute("id", "label-for-email");

    const error = screen.getByTestId("errorMessage");
    expect(error).toBeInTheDocument();
    expect(error).toHaveAttribute("role", "alert");
    expect(error).toHaveTextContent("Invalid email format");

    const field = screen.getByTestId("email");
    expect(field).toBeInTheDocument();
    expect(error).toHaveClass("usa-error-message");
  });
});

describe("buildFormTreeRecursive", () => {
  it("should build a tree for a simple schema", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        name: { type: "string", title: "Name" },
        age: { type: "number", title: "Age" },
      },
    };

    const uiSchema: UiSchema = [
      { type: "field", definition: "/properties/name" },
      { type: "field", definition: "/properties/age" },
    ];

    const errors = null;
    const formData = { name: "John", age: 30 };

    const result = buildFormTreeRecursive({
      errors,
      formData,
      schema,
      uiSchema,
    });

    // render the result
    render(<>{result}</>);

    // assert field inputs
    const nameField = screen.getByTestId("name");
    expect(nameField).toBeInTheDocument();
    expect(nameField).toHaveValue("John");

    const ageField = screen.getByTestId("age");
    expect(ageField).toBeInTheDocument();
    expect(ageField).toHaveValue(30);
  });

  it("should build a tree for a nested schema", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        address: {
          type: "object",
          properties: {
            street: { type: "string", title: "Street" },
            city: { type: "string", title: "City" },
          },
        },
      },
    };

    const uiSchema: UiSchema = [
      {
        name: "address",
        type: "section",
        label: "Address",
        children: [
          {
            type: "field",
            definition: "/properties/address/properties/street",
          },
          { type: "field", definition: "/properties/address/properties/city" },
        ],
      },
    ];

    const errors = null;
    const formData = { address: { street: "123 Main St", city: "Metropolis" } };

    const result = buildFormTreeRecursive({
      errors,
      formData,
      schema,
      uiSchema,
    });

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("address-fieldset");
  });

  it("should handle empty uiSchema gracefully", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        name: { type: "string", title: "Name" },
      },
    };

    const uiSchema: UiSchema = [];
    const errors = null;
    const formData = { name: "John" };

    const result = buildFormTreeRecursive({
      errors,
      formData,
      schema,
      uiSchema,
    });

    expect(result).toEqual([]);
  });

  it("should handle nested children in uiSchema", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        section: {
          type: "object",
          properties: {
            field1: { type: "string", title: "Field 1" },
            field2: { type: "string", title: "Field 2" },
          },
        },
      },
    };

    const uiSchema: UiSchema = [
      {
        name: "section",
        type: "section",
        label: "Section",
        children: [
          {
            type: "field",
            definition: "/properties/section/properties/field1",
          },
          {
            type: "field",
            definition: "/properties/section/properties/field2",
          },
        ],
      },
    ];

    const errors = null;
    const formData = { section: { field1: "Value 1", field2: "Value 2" } };

    const result = buildFormTreeRecursive({
      errors,
      formData,
      schema,
      uiSchema,
    });

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("section-fieldset");
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

describe("getFieldName", () => {
  it("returns correct field name based on definition, removing properties and adding delimiter", () => {
    expect(
      getFieldName({
        definition: "/properties/something/properties/somethingElse",
      }),
    ).toEqual("something--somethingElse");
  });
  // this may not actually work
  it("returns correct field name based on schema", () => {
    expect(
      getFieldName({
        schema: {
          title: "a bunch of stuff",
        },
      }),
    ).toEqual("a-bunch-of-stuff");

    expect(
      getFieldName({
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
  it.only("returns a list of all unconditionally required property paths within a schema", () => {
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
