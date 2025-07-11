import { fireEvent, render, screen } from "@testing-library/react";
import { useAttachmentsContext } from "src/features/attachments/context/AttachmentsContext";
import { Attachment } from "src/types/attachmentTypes";

import React from "react";

import { AttachmentDeleteButton } from "./AttachmentDeleteButton";

jest.mock("src/components/USWDSIcon", () => ({
  USWDSIcon: () => <div data-testid="uswds-icon" />,
}));

jest.mock("src/features/attachments/context/AttachmentsContext");

const mockSetPendingDeleteId = jest.fn();
const mockSetPendingDeleteName = jest.fn();

const mockUseAttachmentsContext = useAttachmentsContext as jest.Mock;

const file: Attachment = {
  application_attachment_id: "file-123",
  file_name: "report.pdf",
  file_size_bytes: 12345,
  mime_type: "application/pdf",
  download_path: "/some/path",
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

const renderButton = (
  overrides: Partial<Attachment> = {},
  deletingIds: Set<string> = new Set(),
) => {
  mockUseAttachmentsContext.mockReturnValue({
    setPendingDeleteId: mockSetPendingDeleteId,
    setPendingDeleteName: mockSetPendingDeleteName,
    deletingIds,
  });

  const modalRef = { current: null };

  render(
    <AttachmentDeleteButton
      buttonText="Delete"
      file={{ ...file, ...overrides }}
      modalRef={modalRef}
    />,
  );
};

beforeEach(() => {
  jest.clearAllMocks();

  mockUseAttachmentsContext.mockReturnValue({
    setPendingDeleteId: mockSetPendingDeleteId,
    setPendingDeleteName: mockSetPendingDeleteName,
    deletingIds: new Set(),
  });
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("@trussworks/react-uswds", () => ({
  ...jest.requireActual("@trussworks/react-uswds"),
  ModalToggleButton: ({
    children,
    onClick,
    ...rest
  }: React.ComponentProps<"button">) => (
    <button
      data-testid="delete-attachment-modal-toggle-button"
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  ),
}));

describe("AttachmentDeleteButton", () => {
  it("renders with text and icon", () => {
    renderButton();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByTestId("uswds-icon")).toBeInTheDocument();
  });

  it("calls setPendingDeleteId and setPendingDeleteName on click", () => {
    renderButton();
    fireEvent.click(
      screen.getByTestId("delete-attachment-modal-toggle-button"),
    );

    expect(mockSetPendingDeleteName).toHaveBeenCalledWith("report.pdf");
    expect(mockSetPendingDeleteId).toHaveBeenCalledWith("file-123");
  });

  it("disables the button when file is being deleted", () => {
    renderButton({}, new Set(["file-123"]));
    expect(
      screen.getByTestId("delete-attachment-modal-toggle-button"),
    ).toBeDisabled();
  });
});
