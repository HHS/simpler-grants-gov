import { OpportunityAttachment } from "src/types/opportunity/opportunityAttachmentTypes";
import { mapOpportunityAttachmentsToFileMetadata } from "src/utils/opportunity/opportunityAttachmentUtils";

describe("mapOpportunityAttachmentsToFileMetadata", () => {
  const attachment: OpportunityAttachment = {
    opportunity_attachment_id: "uuid-1",
    file_name: "document1.pdf",
    mime_type: "application/pdf",
    file_size: 12345,
    created_at: "2024-01-01T00:00:00.000Z",
  };

  it("maps attachment fields to upload file metadata, using created_at as updatedAt and omitting downloadUrl", () => {
    expect(mapOpportunityAttachmentsToFileMetadata([attachment])).toEqual([
      {
        id: "uuid-1",
        fileName: "document1.pdf",
        fileSize: 12345,
        mimeType: "application/pdf",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("maps multiple attachments and preserves their order", () => {
    const secondAttachment: OpportunityAttachment = {
      ...attachment,
      opportunity_attachment_id: "uuid-2",
      file_name: "document2.pdf",
    };

    const metadata = mapOpportunityAttachmentsToFileMetadata([
      attachment,
      secondAttachment,
    ]);

    expect(metadata.map((file) => file.id)).toEqual(["uuid-1", "uuid-2"]);
  });

  it("returns an empty array for an empty input", () => {
    expect(mapOpportunityAttachmentsToFileMetadata([])).toEqual([]);
  });
});
