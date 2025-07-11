import { Attachment } from "src/types/attachmentTypes";

import { getAttachments } from "./getAttachments";

const originalFetch = global.fetch;

describe("getAttachments", () => {
  const applicationId = "app-123";
  const endpoint = `/api/applications/${applicationId}`;

  const mockAttachments: Attachment[] = [
    {
      application_attachment_id: "A1",
      file_name: "file.pdf",
      file_size_bytes: 1000,
      updated_at: "2025-01-01T00:00:00Z",
      download_path: "path/to/file",
      created_at: "2025-01-02T00:00:00Z",
      mime_type: "pdf",
    } as Attachment,
  ];

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("returns attachments when response is ok", async () => {
    const mockJson = jest.fn().mockResolvedValue(mockAttachments);
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: mockJson,
    });

    global.fetch = mockFetch as typeof fetch;

    const result = await getAttachments({ applicationId });

    expect(mockFetch).toHaveBeenCalledWith(endpoint, {
      method: "GET",
      cache: "no-store",
    });

    expect(result).toEqual(mockAttachments);
  });

  it("throws an error when response is not ok", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    global.fetch = mockFetch as typeof fetch;

    await expect(getAttachments({ applicationId })).rejects.toThrow("HTTP 500");
  });
});
