import { deleteAttachment } from "src/features/attachments/api/deleteAttachments";

const originalFetch = global.fetch;

describe("deleteAttachment", () => {
  const applicationId = "app-123";
  const attachmentId = "file-456";
  const endpoint = `/api/applications/${applicationId}/attachments/${attachmentId}`;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("should call fetch with correct URL and method", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch as typeof fetch;

    await deleteAttachment({ applicationId, attachmentId });

    expect(mockFetch).toHaveBeenCalledWith(endpoint, { method: "DELETE" });
  });

  it("should throw an error if fetch response is not ok", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    global.fetch = mockFetch as typeof fetch;

    await expect(
      deleteAttachment({ applicationId, attachmentId }),
    ).rejects.toThrow("Failed to delete attachment: HTTP 500");
  });
});
