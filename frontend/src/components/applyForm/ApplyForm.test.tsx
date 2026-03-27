import { RJSFSchema } from "@rjsf/utils";
import { render, screen, waitFor } from "@testing-library/react";

import ApplyForm from "src/components/applyForm/ApplyForm";
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

jest.mock("src/components/applyForm/actions", () => ({
  handleFormAction: (...args: [...FormActionArgs]) =>
    mockHandleFormAction(...args),
}));

const mockRevalidateTag = jest.fn<void, [string]>();
const getSessionMock = jest.fn();

jest.mock("next/cache", () => ({
  revalidateTag: (tag: string) => mockRevalidateTag(tag),
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("next-navigation-guard", () => ({
  useNavigationGuard: () => jest.fn(),
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
        formId="test"
        formSchema={formSchema}
        savedFormData={{ name: "myself" }}
        uiSchema={uiSchema}
        validationWarnings={[]}
        attachments={[]}
        applicationStatus="in_progress"
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
    expect(nameField).toBeEnabled();

    const dobLabel = screen.getByText("Date of birth");
    expect(dobLabel).toBeInTheDocument();
    expect(dobLabel).toHaveAttribute("for", "dob");

    const dobField = screen.getByTestId("dob");
    expect(dobField).toBeInTheDocument();
    expect(dobField).not.toBeRequired();
    expect(dobField).toHaveAttribute("type", "date");
    expect(dobField).toBeEnabled();

    const nav = screen.getByTestId("InPageNavigation");
    expect(nav).toHaveTextContent("navTitle");

    const textareaField = screen.getByTestId("textarea");
    expect(textareaField).toBeInTheDocument();
    expect(textareaField).not.toBeRequired();
    expect(textareaField).toHaveAttribute("maxlength", "256");

    const selectField = screen.getByTestId("Select");
    expect(selectField).toBeInTheDocument();
    expect(selectField).not.toBeRequired();
    expect(screen.getAllByRole("option").length).toBe(2);
    expect(screen.getByText("test select option")).toBeInTheDocument();
    expect(selectField).toBeEnabled();

    const button = screen.getByTestId("apply-form-save");
    expect(button).toBeInTheDocument();
  });

  it("cannot be edited or saved when application is submitted", () => {
    render(
      <ApplyForm
        applicationId=""
        formId="test"
        formSchema={formSchema}
        savedFormData={{ name: "myself" }}
        uiSchema={uiSchema}
        validationWarnings={[]}
        attachments={[]}
        applicationStatus="submitted"
      />,
    );
    const button = screen.queryByTestId("apply-form-save");
    expect(button).not.toBeInTheDocument();
    const nameField = screen.getByTestId("name");
    expect(nameField).toBeDisabled();

    const dobField = screen.getByTestId("dob");
    expect(dobField).toBeDisabled();

    const selectField = screen.getByTestId("Select");
    expect(selectField).toBeDisabled();
  });

  it("calls handleFormAction action on save", () => {
    mockHandleFormAction.mockImplementation(
      mockHandleFormAction.mockResolvedValue({
        applicationId: "test",
        formId: "test",
        saved: false,
        error: false,
        formData: new FormData(),
      }),
    );

    render(
      <ApplyForm
        applicationId="test"
        formId="test"
        formSchema={formSchema}
        savedFormData={{}}
        uiSchema={uiSchema}
        validationWarnings={[]}
        attachments={[]}
        applicationStatus="in_progress"
      />,
    );

    const button = screen.getByTestId("apply-form-save");
    button.click();

    expect(mockHandleFormAction).toHaveBeenCalledWith(
      {
        applicationId: "test",
        error: false,
        formData: new FormData(),
        formId: "test",
        saved: false,
      },

      expect.any(FormData),
    );
  });
  it("errors when form data is empty", () => {
    mockHandleFormAction.mockImplementation(
      mockHandleFormAction.mockResolvedValue({
        applicationId: "test",
        formId: "test",
        saved: false,
        error: false,
        formData: new FormData(),
      }),
    );

    render(
      <ApplyForm
        applicationId="test"
        formId="test"
        formSchema={{}}
        uiSchema={uiSchema}
        savedFormData={{}}
        validationWarnings={[]}
        attachments={[]}
        applicationStatus="in_progress"
      />,
    );
    const alert = screen.getByTestId("alert");
    expect(alert).toHaveTextContent("Error rendering form");
  });
  it("errors when form data does not conform to JSON schema", () => {
    mockHandleFormAction.mockImplementation(
      mockHandleFormAction.mockResolvedValue({
        applicationId: "test",
        formId: "test",
        saved: false,
        error: false,
        formData: new FormData(),
      }),
    );

    render(
      <ApplyForm
        applicationId="test"
        savedFormData={{}}
        formSchema={{ arbitrayField: "arbirtrary value" }}
        uiSchema={uiSchema}
        formId="test"
        validationWarnings={[]}
        attachments={[]}
        applicationStatus="in_progress"
      />,
    );

    const errorMessage = screen.queryByText("Error rendering form");
    expect(errorMessage).toBeInTheDocument();
  });
  it("does not error when saved form data does not conform to form schema", () => {
    mockHandleFormAction.mockImplementation(
      mockHandleFormAction.mockResolvedValue({
        applicationId: "test",
        formId: "test",
        saved: false,
        error: false,
        formData: new FormData(),
      }),
    );

    render(
      <ApplyForm
        applicationId="test"
        savedFormData={{ arbitrayField: "arbirtrary value" }}
        formSchema={formSchema}
        uiSchema={uiSchema}
        formId="test"
        validationWarnings={[]}
        attachments={[]}
        applicationStatus="in_progress"
      />,
    );

    // form is still correctly built
    const nameLabel = screen.getByText("test name");
    expect(nameLabel).toBeInTheDocument();
    expect(nameLabel).toHaveAttribute("for", "name");

    const errorMessage = screen.queryByText("Error rendering form");
    expect(errorMessage).not.toBeInTheDocument();
  });
  it("provides correct error message", async () => {
    mockHandleFormAction.mockResolvedValue({
      applicationId: "test",
      error: true,
      formData: new FormData(),
      formId: "test",
      saved: true,
    });

    render(
      <ApplyForm
        applicationId=""
        formId="test"
        formSchema={formSchema}
        savedFormData={{ name: "myself" }}
        uiSchema={uiSchema}
        validationWarnings={[
          {
            field: "$.name",
            message: "'this' is an error",
            formatted: "this is an error",
            htmlField: "name",
            value: "",
            type: "",
            definition: "/properties/name",
          },
        ]}
        attachments={[]}
        applicationStatus="in_progress"
      />,
    );
    const button = screen.getByTestId("apply-form-save");
    button.click();
    // error for form
    await waitFor(() => {
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveTextContent("errorTitle");
    });
    // error for field
    await waitFor(() => {
      const alert = screen.getByTestId("errorMessage");
      expect(alert).toHaveTextContent("this is an error");
    });
  });
  it("provides correct validation message", async () => {
    mockHandleFormAction.mockResolvedValue({
      applicationId: "test",
      error: false,
      formData: new FormData(),
      formId: "test",
      saved: true,
    });

    render(
      <ApplyForm
        applicationId=""
        formId="test"
        formSchema={formSchema}
        savedFormData={{ name: "myself" }}
        uiSchema={uiSchema}
        validationWarnings={[
          {
            field: "$.name",
            message: "'this' is an error",
            value: "",
            htmlField: "name",
            type: "",
            formatted: "this is an error",
            definition: "/properties/name",
          },
        ]}
        attachments={[]}
        applicationStatus="in_progress"
      />,
    );
    const button = screen.getByTestId("apply-form-save");
    button.click();
    // error for form
    await waitFor(() => {
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveTextContent("savedTitle");
    });
    await waitFor(() => {
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveTextContent("validationMessage");
    });
    // error for field
    await waitFor(() => {
      const alert = screen.getByTestId("errorMessage");
      expect(alert).toHaveTextContent("this is an error");
    });
  });
  it("provides correct save message", async () => {
    mockHandleFormAction.mockResolvedValue({
      applicationId: "test",
      error: false,
      formData: new FormData(),
      formId: "test",
      saved: true,
    });

    render(
      <ApplyForm
        applicationId=""
        formId="test"
        formSchema={formSchema}
        savedFormData={{ name: "myself" }}
        uiSchema={uiSchema}
        validationWarnings={[]}
        attachments={[]}
        applicationStatus="in_progress"
      />,
    );
    const button = screen.getByTestId("apply-form-save");
    button.click();
    // error for form
    await waitFor(() => {
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveTextContent("savedTitle");
    });
    await waitFor(() => {
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveTextContent("savedMessage");
    });
  });
});
