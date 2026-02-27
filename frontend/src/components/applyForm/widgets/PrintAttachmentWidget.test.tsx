import { RJSFSchema } from "@rjsf/utils";
import { render, screen } from "@testing-library/react";
import { Attachment } from "src/types/attachmentTypes";

import { UswdsWidgetProps } from "src/components/applyForm/types";
import PrintAttachmentWidget from "src/components/applyForm/widgets/PrintAttachmentWidget";

type UseApplicationAttachmentsResult = {
  attachments: Attachment[] | null;
};

const mockUseApplicationAttachments = jest.fn<
  UseApplicationAttachmentsResult,
  []
>();
jest.mock("src/hooks/ApplicationAttachments", () => ({
  useApplicationAttachments: (): UseApplicationAttachmentsResult =>
    mockUseApplicationAttachments(),
}));

describe("PrintAttachmentWidget", () => {
  const defaultProps: UswdsWidgetProps = {
    id: "test-attachment-field",
    required: false,
    schema: {
      title: "Upload Documents",
      type: "array",
    } as RJSFSchema,
    value: [],
    rawErrors: [],
    formClassName: "test-form-class",
    inputClassName: "test-input-class",
    label: "Test Label",
  };

  const mockAttachments: Attachment[] = [
    {
      application_attachment_id: "uuid-1",
      file_name: "document1.pdf",
      download_path: "/download/uuid-1",
      file_size_bytes: 12345,
      mime_type: "application/pdf",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    },
    {
      application_attachment_id: "uuid-2",
      file_name: "document2.docx",
      download_path: "/download/uuid-2",
      file_size_bytes: 23456,
      mime_type:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      created_at: "2024-01-02T00:00:00.000Z",
      updated_at: "2024-01-02T00:00:00.000Z",
    },
    {
      application_attachment_id: "uuid-3",
      file_name: "document3.txt",
      download_path: "/download/uuid-2",
      file_size_bytes: 345,
      mime_type: "text/plain",
      created_at: "2024-01-03T00:00:00.000Z",
      updated_at: "2024-01-03T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApplicationAttachments.mockReturnValue({
      attachments: mockAttachments,
    });
  });

  it("renders with basic props and no attachments", () => {
    render(<PrintAttachmentWidget {...defaultProps} />);

    expect(screen.getByText("Upload Documents")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("displays the field title from schema", () => {
    const props = {
      ...defaultProps,
      schema: {
        ...defaultProps.schema,
        title: "Custom Attachment Field",
      },
    };

    render(<PrintAttachmentWidget {...props} />);

    expect(screen.getByText("Custom Attachment Field")).toBeInTheDocument();
  });

  it("shows required indicator when field is required", () => {
    const props = {
      ...defaultProps,
      required: true,
    };

    render(<PrintAttachmentWidget {...props} />);

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("*")).toHaveClass(
      "usa-hint",
      "usa-hint--required",
      "text-no-underline",
    );
  });

  it("does not show required indicator when field is not required", () => {
    const props = {
      ...defaultProps,
      required: false,
    };

    render(<PrintAttachmentWidget {...props} />);

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("displays uploaded files from array value", () => {
    const props = {
      ...defaultProps,
      value: ["uuid-1", "uuid-2"],
    };

    render(<PrintAttachmentWidget {...props} />);

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("document1.pdf")).toBeInTheDocument();
    expect(screen.getByText("document2.docx")).toBeInTheDocument();
  });

  it("displays file name as text", () => {
    const props = {
      ...defaultProps,
      value: ["uuid-3"],
    };

    render(<PrintAttachmentWidget {...props} />);

    expect(screen.getByText("document3.txt")).toBeInTheDocument();
  });

  it("displays fallback text for files not found in attachments", () => {
    const props = {
      ...defaultProps,
      value: ["uuid-unknown"],
    };

    render(<PrintAttachmentWidget {...props} />);

    expect(screen.getByText("(Previously uploaded file)")).toBeInTheDocument();
  });

  it("handles empty attachments array", () => {
    mockUseApplicationAttachments.mockReturnValue({
      attachments: [],
    });

    const props = {
      ...defaultProps,
      value: ["uuid-1"],
    };

    render(<PrintAttachmentWidget {...props} />);

    expect(screen.getByText("(Previously uploaded file)")).toBeInTheDocument();
  });
});
