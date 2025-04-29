import { RJSFSchema } from "@rjsf/utils";
import { render, screen } from "@testing-library/react";

import ApplyForm from "src/components/applyForm/ApplyForm";
import { UiSchema } from "src/components/applyForm/types";

const mockHandleFormAction = jest.fn();

jest.mock("src/components/applyForm/actions", () => ({
  handleFormAction: (...args: unknown[]): unknown =>
    mockHandleFormAction(...args),
}));

const formSchema: RJSFSchema = {
  title: "test schema",
  properties: {
    name: { type: "string", title: "test name", maxLength: 60 },
    dob: { type: "string", format: "date", title: "Date of birth" },
    address: { type: "string", title: "test address" },
    state: { type: "string", title: "test state" },
    checkbox: { type: "boolean", title: "I agree" },
    textarea: { type: "string", maxLength: 256, title: "Text area" },
  },
  required: ["name"],
};

const uiSchema: UiSchema = [
  {
    type: "section",
    label: "Applicant info",
    name: "ApplicantInfo",
    children: [
      {
        type: "field",
        definition: "/properties/name",
      },
      {
        type: "field",
        definition: "/properties/dob",
      },
    ],
  },
  {
    type: "section",
    label: "Applicant location",
    name: "ApplicantLocation",
    children: [
      {
        type: "field",
        definition: "/properties/address",
      },
      {
        type: "field",
        definition: "/properties/state",
      },
    ],
  },
  {
    type: "section",
    label: "Field Variations",
    name: "FieldVariations",
    children: [
      {
        type: "field",
        definition: "/properties/address",
        widget: "Select",
        schema: {
          enum: ["test select option"],
        },
      },
      {
        type: "field",
        definition: "/properties/textarea",
      },
      {
        type: "field",
        definition: "/properties/checkbox",
      },
    ],
  },
];

describe("ApplyForm", () => {
  it("renders form correctly", () => {
    render(
      <ApplyForm
        applicationId=""
        savedFormData={{ name: "myself" }}
        formSchema={formSchema}
        uiSchema={uiSchema}
        formId="test"
      />,
    );

    const nameLabel = screen.getByText("test name");
    expect(nameLabel).toBeInTheDocument();
    expect(nameLabel).toHaveAttribute("for", "name");

    const nameField = screen.getByTestId("name");
    expect(nameField).toBeInTheDocument();
    expect(nameField).toBeRequired();
    expect(nameField).toHaveAttribute("type", "text");
    expect(nameField).toHaveAttribute("maxLength", "60");
    expect(nameField).toHaveAttribute("name", "name");
    expect(nameField).toHaveValue("myself");

    const dobLabel = screen.getByText("Date of birth");
    expect(dobLabel).toBeInTheDocument();
    expect(dobLabel).toHaveAttribute("for", "dob");

    const dobField = screen.getByTestId("dob");
    expect(dobField).toBeInTheDocument();
    expect(dobField).not.toBeRequired();
    expect(dobField).toHaveAttribute("type", "date");

    const nav = screen.getByTestId("InPageNavigation");
    expect(nav).toHaveTextContent("On this form");

    const textareaField = screen.getByTestId("textarea");
    expect(textareaField).toBeInTheDocument();
    expect(textareaField).not.toBeRequired();
    expect(textareaField).toHaveAttribute("maxlength", "256");

    const selectField = screen.getByTestId("Select");
    expect(selectField).toBeInTheDocument();
    expect(selectField).not.toBeRequired();
    expect(screen.getAllByRole("option").length).toBe(2);
    expect(screen.getByText("test select option")).toBeInTheDocument();

    const button = screen.getByTestId("apply-form-submit");
    expect(button).toBeInTheDocument();
  });

  it("calls handleFormAction action on submit", () => {
    mockHandleFormAction.mockImplementation(() => Promise.resolve());

    render(
      <ApplyForm
        applicationId="test"
        savedFormData={{}}
        formSchema={formSchema}
        uiSchema={uiSchema}
        formId="test"
      />,
    );

    const button = screen.getByTestId("apply-form-submit");
    button.click();

    expect(mockHandleFormAction).toHaveBeenCalledWith(
      {
        applicationId: "test",
        errorMessage: "",
        formData: new FormData(),
        formId: "test",
        successMessage: "",
        validationErrors: [],
      },

      expect.any(FormData),
    );
  });
  it("errors when form data is empty", () => {
    mockHandleFormAction.mockImplementation(() => Promise.resolve());

    render(
      <ApplyForm
        applicationId="test"
        savedFormData={{}}
        formSchema={{}}
        uiSchema={uiSchema}
        formId="test"
      />,
    );
    const alert = screen.getByTestId("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Error rendering form");
  });
  it("errors when form data does not conform to JSON schema", () => {
    mockHandleFormAction.mockImplementation(() => Promise.resolve());

    render(
      <ApplyForm
        applicationId="test"
        savedFormData={{}}
        formSchema={{ arbitrayField: "arbirtrary value" }}
        uiSchema={uiSchema}
        formId="test"
      />,
    );

    const errorMessage = screen.queryByText("Error rendering form");
    expect(errorMessage).toBeInTheDocument();
  });
  it("does not error when saved form data does not conform to form schema", () => {
    mockHandleFormAction.mockImplementation(() => Promise.resolve());

    render(
      <ApplyForm
        applicationId="test"
        savedFormData={{ arbitrayField: "arbirtrary value" }}
        formSchema={formSchema}
        uiSchema={uiSchema}
        formId="test"
      />,
    );

    // form is still correctly built
    const nameLabel = screen.getByText("test name");
    expect(nameLabel).toBeInTheDocument();
    expect(nameLabel).toHaveAttribute("for", "name");

    const errorMessage = screen.queryByText("Error rendering form");
    expect(errorMessage).not.toBeInTheDocument();
  });
});
