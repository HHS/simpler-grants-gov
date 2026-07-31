import { act, render, screen } from "@testing-library/react";
import { UswdsWidgetProps } from "src/types/applyForm/types";
import { Attachment } from "src/types/attachmentTypes";
import { UploadFileMetadata } from "src/types/fileUploadTypes";

import ApplicationAttachmentWidget from "src/components/apply-form/widgets/ApplicationAttachmentWidget";

type UseApplicationAttachmentsResult = {
  attachments: Attachment[] | null;
};

type SimplerFileInputMockProps = {
  id: string;
  postUploadAction: (fileId: string, abortSignal: AbortSignal) => Promise<void>;
  postUploadActionProgressMessage: string;
  postUploadActionSuccessMessage?: string;
  postUploadActionErrorMessage?: string;
  onDelete: (fileId: string) => Promise<unknown>;
  existingFiles?: UploadFileMetadata[];
  disabled?: boolean;
  readOnly?: boolean;
  labelId: string;
};

const mockUseApplicationAttachments = jest.fn<
  UseApplicationAttachmentsResult,
  []
>();
jest.mock("src/hooks/ApplicationAttachments", () => ({
  useApplicationAttachments: (): UseApplicationAttachmentsResult =>
    mockUseApplicationAttachments(),
}));

const mockClientFetch = jest.fn();
jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => mockClientFetch(...args) as unknown,
  }),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ applicationId: "app-123" }),
}));

const mockSimplerFileInput = jest.fn<void, [SimplerFileInputMockProps]>();
jest.mock("src/components/core/fileInput/SimplerFileInput", () => ({
  SimplerFileInput: (props: SimplerFileInputMockProps) => {
    mockSimplerFileInput(props);
    return <div data-testid="simpler-file-input" />;
  },
}));

const getSimplerFileInputProps = (): SimplerFileInputMockProps =>
  mockSimplerFileInput.mock.lastCall?.[0] as SimplerFileInputMockProps;

const getHiddenInput = (container: HTMLElement, name: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  container.querySelector<HTMLInputElement>(
    `input[type="hidden"][name="${name}"]`,
  );

describe("ApplicationAttachmentWidget", () => {
  const existingAttachment: Attachment = {
    application_attachment_id: "uuid-1",
    file_name: "document1.pdf",
    download_path: "/download/uuid-1",
    file_size_bytes: 12345,
    mime_type: "application/pdf",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  };

  const newAttachment: Attachment = {
    application_attachment_id: "uuid-new",
    file_name: "uploaded.pdf",
    download_path: "/download/uuid-new",
    file_size_bytes: 999,
    mime_type: "application/pdf",
    created_at: "2024-02-01T00:00:00.000Z",
    updated_at: "2024-02-01T00:00:00.000Z",
  };

  const defaultProps: UswdsWidgetProps = {
    id: "test-attachment-field",
    required: false,
    schema: {
      title: "Attach supporting document",
      type: "string",
    },
    value: undefined,
    rawErrors: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApplicationAttachments.mockReturnValue({
      attachments: [existingAttachment],
    });
  });

  it("renders the field title from the schema", () => {
    render(<ApplicationAttachmentWidget {...defaultProps} />);

    expect(screen.getByText("Attach supporting document")).toBeInTheDocument();
  });

  it("shows the required indicator when the field is required", () => {
    render(<ApplicationAttachmentWidget {...defaultProps} required={true} />);

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not show the required indicator when the field is not required", () => {
    render(<ApplicationAttachmentWidget {...defaultProps} />);

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders field errors and marks the form group as errored when rawErrors are present", () => {
    const { container } = render(
      <ApplicationAttachmentWidget
        {...defaultProps}
        rawErrors={["This field is required"]}
      />,
    );

    expect(screen.getByText("This field is required")).toBeInTheDocument();
    expect(
      // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
      container.querySelector(".usa-form-group--error"),
    ).toBeInTheDocument();
  });

  it("does not render errors when rawErrors is empty", () => {
    const { container } = render(
      <ApplicationAttachmentWidget {...defaultProps} />,
    );

    expect(
      // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
      container.querySelector(".usa-error-message"),
    ).not.toBeInTheDocument();
    expect(
      // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
      container.querySelector(".usa-form-group--error"),
    ).not.toBeInTheDocument();
  });

  it("prefills from the attachment matching the widget value", () => {
    const { container } = render(
      <ApplicationAttachmentWidget {...defaultProps} value="uuid-1" />,
    );

    expect(getHiddenInput(container, "test-attachment-field")).toHaveValue(
      "uuid-1",
    );
    expect(getSimplerFileInputProps().existingFiles).toEqual([
      {
        id: "uuid-1",
        fileName: "document1.pdf",
        fileSize: 12345,
        mimeType: "application/pdf",
        updatedAt: "2024-01-01T00:00:00.000Z",
        downloadUrl: "/download/uuid-1",
      },
    ]);
  });

  it("renders an empty hidden input when the value does not match any attachment", () => {
    const { container } = render(
      <ApplicationAttachmentWidget {...defaultProps} value="uuid-unknown" />,
    );

    expect(getHiddenInput(container, "test-attachment-field")).toHaveValue("");
    expect(getSimplerFileInputProps().existingFiles).toEqual([]);
  });

  it("renders an empty hidden input when attachments are not loaded", () => {
    mockUseApplicationAttachments.mockReturnValue({ attachments: null });

    const { container } = render(
      <ApplicationAttachmentWidget {...defaultProps} value="uuid-1" />,
    );

    expect(getHiddenInput(container, "test-attachment-field")).toHaveValue("");
  });

  it("creates an application attachment on upload and reports the new id via onChange", async () => {
    mockClientFetch.mockResolvedValue({ data: newAttachment });
    const onChange = jest.fn();

    const { container } = render(
      <ApplicationAttachmentWidget {...defaultProps} onChange={onChange} />,
    );

    const abortSignal = new AbortController().signal;
    await act(async () => {
      await getSimplerFileInputProps().postUploadAction(
        "pending-file-1",
        abortSignal,
      );
    });

    expect(mockClientFetch).toHaveBeenCalledWith(
      "/api/applications/app-123/attachments/create",
      {
        method: "POST",
        signal: abortSignal,
        body: JSON.stringify({ pending_file_id: "pending-file-1" }),
      },
    );
    expect(onChange).toHaveBeenCalledWith("uuid-new");
    expect(getHiddenInput(container, "test-attachment-field")).toHaveValue(
      "uuid-new",
    );
    expect(getSimplerFileInputProps().existingFiles).toEqual([
      {
        id: "uuid-new",
        fileName: "uploaded.pdf",
        fileSize: 999,
        mimeType: "application/pdf",
        updatedAt: "2024-02-01T00:00:00.000Z",
        downloadUrl: "/download/uuid-new",
      },
    ]);
  });

  it("replaces an existing attachment when a new file is uploaded", async () => {
    mockClientFetch.mockResolvedValue({ data: newAttachment });

    const { container } = render(
      <ApplicationAttachmentWidget {...defaultProps} value="uuid-1" />,
    );

    expect(getHiddenInput(container, "test-attachment-field")).toHaveValue(
      "uuid-1",
    );

    await act(async () => {
      await getSimplerFileInputProps().postUploadAction(
        "pending-file-2",
        new AbortController().signal,
      );
    });

    expect(getHiddenInput(container, "test-attachment-field")).toHaveValue(
      "uuid-new",
    );
  });

  it("does not swallow upload errors, so the file input can show its error state", async () => {
    mockClientFetch.mockRejectedValue(new Error("create failed"));

    render(<ApplicationAttachmentWidget {...defaultProps} />);

    await expect(
      getSimplerFileInputProps().postUploadAction(
        "pending-file-1",
        new AbortController().signal,
      ),
    ).rejects.toThrow("create failed");
  });

  it("clears the attachment on delete", async () => {
    const { container } = render(
      <ApplicationAttachmentWidget {...defaultProps} value="uuid-1" />,
    );

    expect(getHiddenInput(container, "test-attachment-field")).toHaveValue(
      "uuid-1",
    );

    await act(async () => {
      await getSimplerFileInputProps().onDelete("uuid-1");
    });

    expect(getHiddenInput(container, "test-attachment-field")).toHaveValue("");
    expect(getSimplerFileInputProps().existingFiles).toEqual([]);
  });

  it("notifies the form that the value was cleared when the attachment is deleted", async () => {
    const onChange = jest.fn();

    render(
      <ApplicationAttachmentWidget
        {...defaultProps}
        value="uuid-1"
        onChange={onChange}
      />,
    );

    await act(async () => {
      await getSimplerFileInputProps().onDelete("uuid-1");
    });

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("passes the upload status messages to the file input", () => {
    render(<ApplicationAttachmentWidget {...defaultProps} />);

    // This tests that the correct i18n keys are used for lookup.
    expect(getSimplerFileInputProps()).toEqual(
      expect.objectContaining({
        postUploadActionProgressMessage: "uploading",
        postUploadActionSuccessMessage: "success",
        postUploadActionErrorMessage: "error",
      }),
    );
  });

  it("describes the file input by the error message when the field has errors", () => {
    render(
      <ApplicationAttachmentWidget
        {...defaultProps}
        rawErrors={["This field is required"]}
      />,
    );

    expect(getSimplerFileInputProps().labelId).toEqual(
      "error-for-test-attachment-field-visible",
    );
  });

  it("describes the file input by the field label when there is a title and no error", () => {
    render(<ApplicationAttachmentWidget {...defaultProps} />);

    expect(getSimplerFileInputProps().labelId).toEqual(
      "label-for-test-attachment-field-visible",
    );
  });

  it("falls back to the generic upload label when the schema has no title", () => {
    render(
      <ApplicationAttachmentWidget
        {...defaultProps}
        schema={{ type: "string" }}
      />,
    );

    expect(getSimplerFileInputProps().labelId).toEqual(
      "app-form-attachment-upload-label",
    );
  });

  it("passes disabled and readOnly through to the file input", () => {
    render(
      <ApplicationAttachmentWidget
        {...defaultProps}
        disabled={true}
        readOnly={true}
      />,
    );

    expect(getSimplerFileInputProps()).toEqual(
      expect.objectContaining({
        id: "test-attachment-field-visible",
        disabled: true,
        readOnly: true,
      }),
    );
  });
});
