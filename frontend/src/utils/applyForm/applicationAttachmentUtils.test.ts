import { Attachment } from "src/types/attachmentTypes";
import {
  ApplicationAttachmentStatus,
  mapAttachmentsToFileMetadata,
} from "src/utils/applyForm/applicationAttachmentUtils";

describe("mapAttachmentsToFileMetadata", () => {
  const attachment: Attachment = {
    application_attachment_id: "uuid-1",
    file_name: "document1.pdf",
    download_path: "/download/uuid-1",
    file_size_bytes: 12345,
    mime_type: "application/pdf",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-02T00:00:00.000Z",
  };

  it("maps attachment fields to upload file metadata", () => {
    expect(mapAttachmentsToFileMetadata([attachment])).toEqual([
      {
        id: "uuid-1",
        fileName: "document1.pdf",
        fileSize: 12345,
        mimeType: "application/pdf",
        updatedAt: "2024-01-02T00:00:00.000Z",
        downloadUrl: "/download/uuid-1",
      },
    ]);
  });

  it("maps multiple attachments and preserves their order", () => {
    const secondAttachment: Attachment = {
      ...attachment,
      application_attachment_id: "uuid-2",
      file_name: "document2.pdf",
    };

    const metadata = mapAttachmentsToFileMetadata([
      attachment,
      secondAttachment,
    ]);

    expect(metadata).toHaveLength(2);
    expect(metadata.map(({ id }) => id)).toEqual(["uuid-1", "uuid-2"]);
    expect(metadata.map(({ fileName }) => fileName)).toEqual([
      "document1.pdf",
      "document2.pdf",
    ]);
  });

  it("returns an empty list when there are no attachments", () => {
    expect(mapAttachmentsToFileMetadata([])).toEqual([]);
  });
});

describe("ApplicationAttachmentStatus", () => {
  it("provides a user facing message for each upload phase", () => {
    expect(ApplicationAttachmentStatus.uploading).toEqual(expect.any(String));
    expect(ApplicationAttachmentStatus.uploading).not.toHaveLength(0);
    expect(ApplicationAttachmentStatus.success).toEqual(expect.any(String));
    expect(ApplicationAttachmentStatus.success).not.toHaveLength(0);
    expect(ApplicationAttachmentStatus.error).toEqual(expect.any(String));
    expect(ApplicationAttachmentStatus.error).not.toHaveLength(0);
  });
});
