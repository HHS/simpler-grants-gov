/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RJSFSchema } from "@rjsf/utils";
import { render, screen } from "@testing-library/react";
import { Attachment } from "src/types/attachmentTypes";

import PrintForm from "src/components/applyForm/PrintForm";
import { UiSchema } from "src/components/applyForm/types";

// Mock FormFields component
jest.mock("src/components/applyForm/FormFields", () => ({
  FormFields: ({ formData, schema, uiSchema, errors }: any) => (
    <div data-testid="form-fields">
      <div data-testid="form-data">{JSON.stringify(formData)}</div>
      <div data-testid="schema">{JSON.stringify(schema)}</div>
      <div data-testid="ui-schema">{JSON.stringify(uiSchema)}</div>
      <div data-testid="errors">{JSON.stringify(errors)}</div>
    </div>
  ),
}));

// Mock AttachmentsProvider
jest.mock("src/hooks/ApplicationAttachments", () => ({
  AttachmentsProvider: ({ children, value }: any) => (
    <div data-testid="attachments-provider" data-value={JSON.stringify(value)}>
      {children}
    </div>
  ),
}));

describe("PrintForm", () => {
  const mockSetAttachmentsChanged = jest.fn();

  const defaultProps = {
    attachments: [] as Attachment[],
    formSchema: {
      type: "object",
      properties: {
        name: { type: "string", title: "Name" },
        email: { type: "string", title: "Email" },
      },
    } as RJSFSchema,
    savedFormData: {
      name: "John Doe",
      email: "john@example.com",
    },
    uiSchema: [
      {
        type: "field" as const,
        definition: "/properties/name" as const,
        schema: { title: "Name" },
      },
      {
        type: "field" as const,
        definition: "/properties/email" as const,
        schema: { title: "Email" },
      },
    ] as UiSchema,
    setAttachmentsChanged: mockSetAttachmentsChanged,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with basic props", () => {
    render(<PrintForm {...defaultProps} />);

    expect(screen.getByTestId("attachments-provider")).toBeInTheDocument();
    expect(screen.getByTestId("form-fields")).toBeInTheDocument();
  });

  it("passes form data to FormFields", () => {
    render(<PrintForm {...defaultProps} />);

    const formDataElement = screen.getByTestId("form-data");
    expect(formDataElement).toHaveTextContent(
      JSON.stringify(defaultProps.savedFormData),
    );
  });

  it("passes form schema to FormFields", () => {
    render(<PrintForm {...defaultProps} />);

    const schemaElement = screen.getByTestId("schema");
    expect(schemaElement).toHaveTextContent(
      JSON.stringify(defaultProps.formSchema),
    );
  });

  it("passes ui schema to FormFields", () => {
    render(<PrintForm {...defaultProps} />);

    const uiSchemaElement = screen.getByTestId("ui-schema");
    expect(uiSchemaElement).toHaveTextContent(
      JSON.stringify(defaultProps.uiSchema),
    );
  });

  it("passes null errors to FormFields", () => {
    render(<PrintForm {...defaultProps} />);

    const errorsElement = screen.getByTestId("errors");
    expect(errorsElement).toHaveTextContent("null");
  });

  it("provides empty array when attachments is undefined", () => {
    const props = {
      ...defaultProps,
      attachments: undefined as any,
    };

    render(<PrintForm {...props} />);

    const providerElement = screen.getByTestId("attachments-provider");
    const providerValue: { attachments: Attachment[] } = JSON.parse(
      providerElement.getAttribute("data-value") || "{}",
    );

    expect(providerValue.attachments).toEqual([]);
  });

  it("provides empty array when attachments is null", () => {
    const props = {
      ...defaultProps,
      attachments: null as any,
    };

    render(<PrintForm {...props} />);

    const providerElement = screen.getByTestId("attachments-provider");
    const providerValue: { attachments: Attachment[] } = JSON.parse(
      providerElement.getAttribute("data-value") || "{}",
    );

    expect(providerValue.attachments).toEqual([]);
  });

  it("handles complex form data", () => {
    const complexFormData = {
      personalInfo: {
        firstName: "Jane",
        lastName: "Smith",
        address: {
          street: "123 Main St",
          city: "Anytown",
          zipCode: "12345",
        },
      },
      preferences: ["email", "phone"],
      isActive: true,
    };

    const props = {
      ...defaultProps,
      savedFormData: complexFormData,
    };

    render(<PrintForm {...props} />);

    const formDataElement = screen.getByTestId("form-data");
    expect(formDataElement).toHaveTextContent(JSON.stringify(complexFormData));
  });

  it("handles complex form schema", () => {
    const complexSchema: RJSFSchema = {
      type: "object",
      properties: {
        personalInfo: {
          type: "object",
          properties: {
            firstName: { type: "string", title: "First Name" },
            lastName: { type: "string", title: "Last Name" },
          },
          required: ["firstName", "lastName"],
        },
        preferences: {
          type: "array",
          items: { type: "string" },
          title: "Preferences",
        },
      },
      required: ["personalInfo"],
    };

    const props = {
      ...defaultProps,
      formSchema: complexSchema,
    };

    render(<PrintForm {...props} />);

    const schemaElement = screen.getByTestId("schema");
    expect(schemaElement).toHaveTextContent(JSON.stringify(complexSchema));
  });

  it("handles complex ui schema", () => {
    const complexUiSchema: UiSchema = [
      {
        type: "section" as const,
        name: "personal-section",
        label: "Personal Information",
        children: [
          {
            type: "field" as const,
            definition:
              "/properties/personalInfo/properties/firstName" as const,
            schema: { title: "First Name" },
          },
          {
            type: "field" as const,
            definition: "/properties/personalInfo/properties/lastName" as const,
            schema: { title: "Last Name" },
          },
        ],
      },
      {
        type: "field" as const,
        definition: "/properties/preferences" as const,
        schema: { title: "Preferences" },
      },
    ];

    const props = {
      ...defaultProps,
      uiSchema: complexUiSchema,
    };

    render(<PrintForm {...props} />);

    const uiSchemaElement = screen.getByTestId("ui-schema");
    expect(uiSchemaElement).toHaveTextContent(JSON.stringify(complexUiSchema));
  });

  it("handles empty form data", () => {
    const props = {
      ...defaultProps,
      savedFormData: {},
    };

    render(<PrintForm {...props} />);

    const formDataElement = screen.getByTestId("form-data");
    expect(formDataElement).toHaveTextContent("{}");
  });

  it("handles empty ui schema", () => {
    const props = {
      ...defaultProps,
      uiSchema: [] as UiSchema,
    };

    render(<PrintForm {...props} />);

    const uiSchemaElement = screen.getByTestId("ui-schema");
    expect(uiSchemaElement).toHaveTextContent("[]");
  });
});
