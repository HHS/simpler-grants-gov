import { RJSFSchema } from "@rjsf/utils";
import { render, screen } from "@testing-library/react";
import { UiSchema } from "src/types/applyForm/types";

import { FormFields } from "src/components/apply-form/FormFields";

const mockMergeAllOf = jest.fn();

// useAttachmentDelete is used in file input widgets, included through the WidgetRenderer import
// those widgets use the hook to make API calls using a server action so the hook needs to be mocked
jest.mock("src/hooks/useAttachmentDelete", () => ({
  useAttachmentDelete: () => ({
    deleteAttachment: () => {},
  }),
}));

jest.mock("json-schema-merge-allof", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockMergeAllOf(...args) as unknown,
}));

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

    render(
      <FormFields
        errors={errors}
        formData={formData}
        schema={schema}
        uiSchema={uiSchema}
      />,
    );

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

    render(
      <FormFields
        errors={errors}
        formData={formData}
        schema={schema}
        uiSchema={uiSchema}
      />,
    );

    const fieldSets = screen.getAllByTestId("fieldset");
    expect(fieldSets).toHaveLength(1);
    expect(fieldSets[0]).toHaveAttribute("id", "form-section-address");

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(2);

    expect(screen.getByTestId("address--street")).toBeInTheDocument();
    expect(screen.getByTestId("address--city")).toBeInTheDocument();
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

    render(
      <FormFields
        errors={errors}
        formData={formData}
        schema={schema}
        uiSchema={uiSchema}
      />,
    );

    const fieldSets = screen.queryAllByTestId("fieldset");
    expect(fieldSets).toHaveLength(0);
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

    render(
      <FormFields
        errors={errors}
        formData={formData}
        schema={schema}
        uiSchema={uiSchema}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Section" }),
    ).toBeInTheDocument();

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(2);

    expect(screen.getByTestId("section--field1")).toBeInTheDocument();
    expect(screen.getByTestId("section--field2")).toBeInTheDocument();
  });

  it("should render a Table multiField widget inside a section", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        first_value: {
          type: "number",
          title: "First Value",
        },
        second_value: {
          type: "number",
          title: "Second Value",
          readOnly: true,
        },
      },
    };

    const uiSchema: UiSchema = [
      {
        type: "section",
        name: "table_demo",
        label: "Table Demo",
        children: [
          {
            type: "multiField",
            name: "summary_table_test",
            widget: "Table",
            definition: ["/properties/first_value", "/properties/second_value"],
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

    render(
      <FormFields
        errors={null}
        formData={{
          first_value: 2500,
          second_value: 1000,
        }}
        schema={schema}
        uiSchema={uiSchema}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Table Demo" }),
    ).toBeInTheDocument();

    const table = screen.getByTestId("table");

    expect(table).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getAllByRole("cell")).toHaveLength(3);

    expect(
      screen.getByRole("columnheader", { name: "Item" }),
    ).toBeInTheDocument();

    expect(screen.getByText("First Row")).toBeInTheDocument();
  });

  describe("FormFields formContext forwarding", () => {
    it("forwards formContext to rendered widgets", () => {
      const schema: RJSFSchema = {
        type: "object",
        properties: {
          example: { type: "string", title: "Example" },
        },
      };

      const uiSchema: UiSchema = [
        {
          type: "field",
          definition: "/properties/example",
        },
      ];

      const formContext = {
        rootFormData: { activity_line_items: [{ activity_title: "Test" }] },
        rootSchema: schema,
      };

      render(
        <FormFields
          errors={null}
          formData={{ example: "hello" }}
          schema={schema}
          uiSchema={uiSchema}
          formContext={formContext}
        />,
      );

      // grab the rendered input
      const input = screen.getByTestId("example");

      expect(input).toBeInTheDocument();

      // verify that rendering still works with formContext
      expect(input).toHaveValue("hello");
    });
  });
});
