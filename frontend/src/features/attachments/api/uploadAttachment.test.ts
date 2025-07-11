import { Attachment } from "src/types/attachmentTypes";

import { uploadAttachment } from "./uploadAttachment";

const originalFetch = global.fetch;

describe("uploadAttachment", () => {
  const mockFile = new File(["dummy content"], "test.pdf", {
    type: "application/pdf",
  });
  const applicationId = "app-123";
  const uploadUrl = `/api/applications/${applicationId}/attachments`;

  const mockAttachments: Attachment[] = [
    {
      application_attachment_id: "A1",
      file_name: "test.pdf",
      file_size_bytes: 1234,
      updated_at: "2025-07-01T12:00:00Z",
      download_path: "path/to/file",
      created_at: "2025-01-02T00:00:00Z",
      mime_type: "pdf",
    } as Attachment,
  ];

  const mockFetch = jest.fn<
    ReturnType<typeof fetch>,
    Parameters<typeof fetch>
  >();
  mockFetch.mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ data: mockAttachments }),
  } as unknown as Response);

  global.fetch = mockFetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("uploads a file and returns attachment data", async () => {
    const mockJson = jest.fn().mockResolvedValue({ data: mockAttachments });
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: mockJson,
    } as unknown as Response);

    global.fetch = mockFetch as typeof fetch;

    const result = await uploadAttachment({ applicationId, file: mockFile });

    expect(mockFetch).toHaveBeenCalledWith(
      uploadUrl,
      expect.objectContaining({
        method: "POST",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        body: expect.any(FormData),
        headers: undefined,
      }),
    );

    expect(result).toEqual(mockAttachments);
  });

  it("includes Authorization header when token is provided", async () => {
    const token = "secret-token";
    const mockJson = jest.fn().mockResolvedValue({ data: mockAttachments });
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: mockJson,
    });

    global.fetch = mockFetch as typeof fetch;

    await uploadAttachment({ applicationId, file: mockFile, token });

    expect(mockFetch).toHaveBeenCalledWith(
      uploadUrl,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  });

  it("throws an error if response is not ok", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    global.fetch = mockFetch as typeof fetch;

    await expect(
      uploadAttachment({ applicationId, file: mockFile }),
    ).rejects.toThrow("Failed to delete attachment: HTTP 500");
  });

  it("supports passing an AbortSignal", async () => {
    const mockJson = jest.fn().mockResolvedValue({ data: mockAttachments });
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: mockJson,
    });

    global.fetch = mockFetch as typeof fetch;

    const controller = new AbortController();

    await uploadAttachment({
      applicationId,
      file: mockFile,
      signal: controller.signal,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      uploadUrl,
      expect.objectContaining({
        signal: controller.signal,
      }),
    );
  });
});
