import { RJSFSchema } from "@rjsf/utils";
import { render, screen, waitFor } from "@testing-library/react";
import ApplyForm from "src/app/[locale]/(base)/workspace/applications/[applicationId]/form/[appFormId]/_components/ApplyForm";
import { UiSchema } from "src/types/applyForm/types";
import { Attachment } from "src/types/attachmentTypes";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useParams: () => ({ applicationId: "application-123" }),
}));

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

jest.mock(
  "src/app/[locale]/(base)/workspace/applications/[applicationId]/form/[appFormId]/actions",
  () => ({
    handleFormAction: (...args: [...FormActionArgs]) =>
      mockHandleFormAction(...args),
    // referenced by useAttachmentDelete within the legacy attachment widget
    deleteAttachmentAction: jest.fn(),
  }),
);

const mockRevalidateTag = jest.fn<void, [string]>();
const getSessionMock = jest.fn();

jest.mock("next/cache", () => ({
  revalidateTag: (tag: string) => mockRevalidateTag(tag),
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

// mirrors the shape of the Attachment Form's schema after processing ($refs resolved, allOf merged)
const attachmentFormSchema: RJSFSchema = {
  title: "attachment form schema",
  properties: {
    att1: { type: "string", title: "Attachment 1" },
  },
};

const attachmentUiSchema: UiSchema = [
  {
    type: "section",
    label: "1) Attachment 1",
    name: "attachment1",
    children: [
      {
        type: "field",
        definition: "/properties/att1",
        widget: "Attachment",
      },
    ],
  },
];

const savedAttachment: Attachment = {
  application_attachment_id: "22222222-2222-4222-8222-222222222222",
  file_name: "narrative.pdf",
  download_path: "/download/narrative.pdf",
  file_size_bytes: 2048,
  mime_type: "application/pdf",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-02T00:00:00.000Z",
};

const getHiddenInput = (container: HTMLElement, name: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  container.querySelector<HTMLInputElement>(
    `input[type="hidden"][name="${name}"]`,
  );

describe("ApplyForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    mockHandleFormAction.mockClear();
  });

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

    expect(screen.getByTestId("apply-form-return")).toBeInTheDocument();
    expect(screen.getByText("savingAndRefreshing")).toBeInTheDocument();
    expect(screen.getByText("returnToApplication")).toBeInTheDocument();
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
  it("displays created message when updatedAt is missing", () => {
    const timestamp = "2026-06-27T12:34:56.000Z";

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
        createdAt={timestamp}
      />,
    );

    expect(screen.getByText(/createdMessage/i)).toBeInTheDocument();
  });

  it("displays created message when createdAt equals updatedAt exactly", () => {
    const timestamp = "2026-06-27T12:34:56.000Z";

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
        createdAt={timestamp}
        updatedAt={timestamp}
      />,
    );

    expect(screen.getByText(/createdMessage/i)).toBeInTheDocument();
  });

  it("displays created message when createdAt and updatedAt differ by <= 1s", () => {
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
        createdAt="2026-06-27T12:34:56.000Z"
        updatedAt="2026-06-27T12:34:56.500Z"
      />,
    );

    expect(screen.getByText(/createdMessage/i)).toBeInTheDocument();
  });

  it("displays last updated message when updatedAt differs from createdAt", () => {
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
        createdAt="2026-06-26T12:34:56.000Z"
        updatedAt="2026-06-27T12:34:56.000Z"
      />,
    );

    expect(screen.getByText(/lastUpdatedMessage/i)).toBeInTheDocument();
  });

  it("navigates back to application when return button is clicked", () => {
    render(
      <ApplyForm
        applicationId="application-123"
        formId="test"
        formSchema={formSchema}
        savedFormData={{ name: "myself" }}
        uiSchema={uiSchema}
        validationWarnings={[]}
        attachments={[]}
        applicationStatus="in_progress"
      />,
    );

    const returnButton = screen.getByTestId("apply-form-return");
    returnButton.click();

    expect(pushMock).toHaveBeenCalledWith(
      "/workspace/applications/application-123",
    );
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

  describe("attachment widget rendering", () => {
    it("renders the virus scanning attachment widget for a saved attachment when useVirusScanning is on", () => {
      const { container } = render(
        <ApplyForm
          applicationId="application-123"
          formId="test"
          formSchema={attachmentFormSchema}
          savedFormData={{
            att1: savedAttachment.application_attachment_id,
          }}
          uiSchema={attachmentUiSchema}
          validationWarnings={[]}
          attachments={[savedAttachment]}
          applicationStatus="in_progress"
          useVirusScanning={true}
        />,
      );

      // the hidden input carries the saved attachment id into the form submission
      expect(getHiddenInput(container, "att1")).toHaveValue(
        savedAttachment.application_attachment_id,
      );

      // the virus scanning widget keeps its native file input mounted
      expect(screen.getByTestId("file-input")).toBeInTheDocument();

      // the saved attachment's metadata is resolved from the attachments prop
      expect(screen.getByTestId("file-input-existing-files")).toHaveTextContent(
        "narrative.pdf",
      );
    });

    it("renders an empty virus scanning attachment field when there is no saved value", () => {
      const { container } = render(
        <ApplyForm
          applicationId="application-123"
          formId="test"
          formSchema={attachmentFormSchema}
          savedFormData={{}}
          uiSchema={attachmentUiSchema}
          validationWarnings={[]}
          attachments={[savedAttachment]}
          applicationStatus="in_progress"
          useVirusScanning={true}
        />,
      );

      expect(screen.getByText("Attachment 1")).toBeInTheDocument();
      expect(getHiddenInput(container, "att1")).toHaveValue("");
      expect(screen.getByTestId("file-input")).toBeInTheDocument();
      expect(
        screen.queryByTestId("file-input-existing-files"),
      ).not.toBeInTheDocument();
    });

    it("renders the legacy attachment widget when useVirusScanning is off", () => {
      const { container } = render(
        <ApplyForm
          applicationId="application-123"
          formId="test"
          formSchema={attachmentFormSchema}
          savedFormData={{
            att1: savedAttachment.application_attachment_id,
          }}
          uiSchema={attachmentUiSchema}
          validationWarnings={[]}
          attachments={[savedAttachment]}
          applicationStatus="in_progress"
          useVirusScanning={false}
        />,
      );

      // the legacy widget still submits the saved attachment id
      expect(getHiddenInput(container, "att1")).toHaveValue(
        savedAttachment.application_attachment_id,
      );

      // but unmounts its file input once a file exists, and renders the
      // file name without the existing-files display
      expect(screen.queryByTestId("file-input")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("file-input-existing-files"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("narrative.pdf")).toBeInTheDocument();
    });
  });
});
