import { RJSFSchema } from "@rjsf/utils";
import { render, screen } from "@testing-library/react";

import {
  FieldErrors,
  UiSchema,
  UiSchemaField,
} from "src/components/applyForm/types";
import {
  buildField,
  buildFormTreeRecursive,
  determineFieldType,
  getApplicationResponse,
  shapeFormData,
} from "src/components/applyForm/utils";

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useCallback: (fn: unknown) => fn,
}));

describe("shapeFormData", () => {
  it("should shape form data to the form schema", () => {
    const formSchema: RJSFSchema = {
      title: "test schema",
      properties: {
        name: { type: "string", title: "test name", maxLength: 60 },
        dob: { type: "string", format: "date", title: "Date of birth" },
        address: { type: "string", title: "test address" },
        state: { type: "string", title: "test state" },
      },
      required: ["name"],
    };

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

    const data = shapeFormData(formData, formSchema);

    expect(data).toMatchObject(shapedFormData);
  });
  it("should shape nested form data", () => {
    const formSchema: RJSFSchema = {
      type: "object",
      title: "test schema",
      properties: {
        name: { type: "string", title: "test name", maxLength: 60 },
        dob: { type: "string", format: "date", title: "Date of birth" },
        address: {
          type: "object",
          properties: {
            street: { type: "string", title: "street" },
            zip: { type: "number", title: "zip code" },
            state: { type: "string", title: "test state" },
            question: {
              type: "object",
              properties: {
                own: { type: "string", title: "own" },
                rent: { type: "string", title: "rent" },
                other: { type: "string", title: "other" },
              },
            },
          },
        },
        tasks: {
          type: "array",
          title: "Tasks",
          items: {
            type: "object",
            required: ["title"],
            properties: {
              title: {
                type: "string",
                title: "Important task",
              },
              done: {
                type: "boolean",
                title: "Done?",
                default: false,
              },
            },
          },
        },
        todos: {
          type: "array",
          title: "Tasks",
          items: {
            type: "string",
            title: "Reminder",
          },
        },
      },
      required: ["name"],
    };

    const shapedFormData = {
      name: "test",
      dob: "01/01/1900",
      address: {
        street: "test street",
        zip: "1234",
        state: "XX",
        question: {
          rent: "yes",
        },
      },
      tasks: [
        {
          title: "Submit form",
          done: "false",
        },
        {
          title: "Start form",
          done: "true",
        },
      ],
      todos: ["email", "write"],
    };

    const formData = new FormData();
    formData.append("street", "test street");
    formData.append("name", "test");
    formData.append("state", "XX");
    formData.append("zip", "1234");
    formData.append("dob", "01/01/1900");
    formData.append("rent", "yes");
    const tasks: Array<{ title: string; done: string }> = [
      { title: "Submit form", done: "false" },
      { title: "Start form", done: "true" },
    ];

    tasks.forEach((obj, index) => {
      (Object.keys(obj) as Array<keyof typeof obj>).forEach((key) => {
        formData.append(`tasks[${index}][${key}]`, String(obj[key]));
      });
    });
    formData.append("todos[0]", "email");
    formData.append("todos[1]", "write");

    const data = shapeFormData(formData, formSchema);
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

    const errors: FieldErrors = [];
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

  it("should handle fields with no definition", () => {
    const uiFieldObject: UiSchemaField = {
      type: "field",
      schema: {
        type: "number",
        title: "Age",
      },
    };

    const formSchema: RJSFSchema = {
      type: "object",
      properties: {
        age: { type: "number", title: "Age" },
      },
    };

    const errors: FieldErrors = [];
    const formData = {};

    const BuiltField = buildField({
      uiFieldObject,
      formSchema,
      errors,
      formData,
    });
    render(BuiltField);

    const label = screen.getByTestId("label");
    expect(label).toHaveAttribute("for", "Age");
    expect(label).toHaveAttribute("id", "label-for-Age");

    const field = screen.getByTestId("Age");
    expect(field).toBeInTheDocument();
    expect(field).not.toBeRequired();
    expect(field).toHaveAttribute("type", "number");
    // the fields not in the json schema do not have values
    expect(field).not.toHaveValue();
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
        instancePath: "/email",
        schemaPath: "#/properties/email",
        keyword: "format",
        params: { format: "email" },
        message: "Invalid email format",
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

    const errors: FieldErrors = [];
    const formData = { name: "John", age: 30 };

    const result = buildFormTreeRecursive({
      errors,
      formData,
      schema,
      uiSchema,
    });

    expect(result).toHaveLength(2);
    expect(result[0].key).toBe("wrapper-for-name");
    expect(result[1].key).toBe("wrapper-for-age");
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

    const errors: FieldErrors = [];
    const formData = { address: { street: "123 Main St", city: "Metropolis" } };

    const result = buildFormTreeRecursive({
      errors,
      formData,
      schema,
      uiSchema,
    });

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("address-wrapper");
  });

  it("should handle empty uiSchema gracefully", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        name: { type: "string", title: "Name" },
      },
    };

    const uiSchema: UiSchema = [];
    const errors: FieldErrors = [];
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

    const errors: FieldErrors = [];
    const formData = { section: { field1: "Value 1", field2: "Value 2" } };

    const result = buildFormTreeRecursive({
      errors,
      formData,
      schema,
      uiSchema,
    });

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("section-wrapper");
  });
});

describe("getApplicationResponse", () => {
  it("should return a structured response for valid input", () => {
    const forms = [
      {
        application_form_id: "test",
        application_id: "test",
        application_response: { test: "test" },
        form_id: "test",
      },
    ];

    const result = getApplicationResponse(forms, "test");

    expect(result).toEqual({ test: "test" });
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
