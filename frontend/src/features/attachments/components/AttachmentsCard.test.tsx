/* eslint-disable import/first */
import { fireEvent, render, screen } from "@testing-library/react";
import { AttachmentsCard } from "src/features/attachments/components/AttachmentsCard";
import { useAttachmentsContext } from "src/features/attachments/context/AttachmentsContext";
import { useAttachmentDelete } from "src/features/attachments/hooks/useAttachmentDelete";
import { useAttachmentUpload } from "src/features/attachments/hooks/useAttachmentUpload";

jest.mock("src/features/attachments/context/AttachmentsContext");
jest.mock("src/features/attachments/hooks/useAttachmentDelete");
jest.mock("src/features/attachments/hooks/useAttachmentUpload", () => ({
  useAttachmentUpload: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUploadAttachment = jest.fn();
const mockDeleteAttachment = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();

  (useAttachmentsContext as jest.Mock).mockReturnValue({
    attachments: [
      {
        application_attachment_id: "id-1",
        file_name: "test.pdf",
        file_size_bytes: 1000,
        updated_at: new Date().toISOString(),
        status: "uploaded",
      },
    ],
    deletingIds: new Set(),
    fileInputRef: { current: null },
  });

  (useAttachmentUpload as jest.Mock).mockReturnValue({
    uploadAttachment: mockUploadAttachment,
  });

  (useAttachmentDelete as jest.Mock).mockReturnValue({
    deleteAttachment: mockDeleteAttachment,
  });
});
describe("AttachmentsCard", () => {
  it("calls uploadAttachment when file is selected", () => {
    render(<AttachmentsCard />);
    const fileInput = screen.getByTestId("file-input-input");
    const testFile = new File(["dummy content"], "test.pdf", {
      type: "application/pdf",
    });

    // Fire file change with mock FileList
    fireEvent.change(fileInput, {
      target: {
        files: {
          0: testFile,
          length: 1,
          item: () => testFile,
          [Symbol.iterator]: function* () {
            yield testFile;
          },
        },
      },
    });

    expect(mockUploadAttachment).toHaveBeenCalledWith(testFile);
  });
});
