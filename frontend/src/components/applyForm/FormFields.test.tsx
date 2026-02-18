import { RJSFSchema } from "@rjsf/utils";
import { render, screen } from "@testing-library/react";

import { FormFields } from "src/components/applyForm/FormFields";
import { UiSchema } from "src/components/applyForm/types";

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
});
