/**
 * @jest-environment node
 */

import { createApplicationAttachmentHandler } from "src/app/api/applications/[applicationId]/attachments/create/handler";
import { ApiRequestError } from "src/errors";
import { Attachment } from "src/types/attachmentTypes";

const getSessionMock = jest.fn();
const mockCreateApplicationAttachment = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("src/services/fetch/fetchers/applicationFetcher", () => ({
  createApplicationAttachment: (applicationId: string, pendingFileId: string) =>
    mockCreateApplicationAttachment(applicationId, pendingFileId) as unknown,
}));

const attachment: Attachment = {
  application_attachment_id: "22222222-2222-4222-8222-222222222222",
  file_name: "narrative.pdf",
  download_path: "/download/narrative.pdf",
  file_size_bytes: 2048,
  mime_type: "application/pdf",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-02T00:00:00.000Z",
};

const fakeRequest = (body: unknown, { malformed = false } = {}) =>
  ({
    json: jest.fn(() =>
      malformed
        ? Promise.reject(new SyntaxError("Unexpected end of JSON input"))
        : Promise.resolve(body),
    ),
    method: "POST",
  }) as unknown as Request;

const options = { params: Promise.resolve({ applicationId: "app-123" }) };

const readJson = (response: Response) =>
  response.json() as Promise<{ message?: string; data?: Attachment }>;

describe("POST request", () => {
  beforeEach(() => {
    getSessionMock.mockReturnValue({ token: "fakeToken" });
  });
  afterEach(() => jest.clearAllMocks());

  it("creates the application attachment and returns it", async () => {
    mockCreateApplicationAttachment.mockResolvedValue({ data: attachment });

    const response = await createApplicationAttachmentHandler(
      fakeRequest({ pending_file_id: "pending-file-1" }),
      options,
    );

    expect(response.status).toBe(200);
    expect((await readJson(response)).data).toEqual(attachment);
    expect(mockCreateApplicationAttachment).toHaveBeenCalledWith(
      "app-123",
      "pending-file-1",
    );
  });

  it("returns 401 when the session has no token", async () => {
    getSessionMock.mockReturnValue({ token: "" });

    const response = await createApplicationAttachmentHandler(
      fakeRequest({ pending_file_id: "pending-file-1" }),
      options,
    );

    expect(response.status).toBe(401);
    expect((await readJson(response)).message).toBe("Unauthenticated");
    expect(mockCreateApplicationAttachment).not.toHaveBeenCalled();
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    const response = await createApplicationAttachmentHandler(
      fakeRequest(undefined, { malformed: true }),
      options,
    );

    expect(response.status).toBe(400);
    expect((await readJson(response)).message).toBe("Malformed request body");
    expect(mockCreateApplicationAttachment).not.toHaveBeenCalled();
  });

  it("returns 400 when pending_file_id is missing", async () => {
    const response = await createApplicationAttachmentHandler(
      fakeRequest({}),
      options,
    );

    expect(response.status).toBe(400);
    expect((await readJson(response)).message).toBe("Missing pending_file_id");
    expect(mockCreateApplicationAttachment).not.toHaveBeenCalled();
  });

  it("returns 500 with the underlying message when the API call fails", async () => {
    mockCreateApplicationAttachment.mockRejectedValue(
      new Error("API exploded"),
    );

    const response = await createApplicationAttachmentHandler(
      fakeRequest({ pending_file_id: "pending-file-1" }),
      options,
    );

    expect(response.status).toBe(500);
    expect((await readJson(response)).message).toBe(
      "Error failed to upload attachment: API exploded",
    );
  });

  it("passes through the status of an API error", async () => {
    mockCreateApplicationAttachment.mockRejectedValue(
      new ApiRequestError("Attachment limit exceeded", "APIRequestError", 422),
    );

    const response = await createApplicationAttachmentHandler(
      fakeRequest({ pending_file_id: "pending-file-1" }),
      options,
    );

    expect(response.status).toBe(422);
    expect((await readJson(response)).message).toBe(
      "Error failed to upload attachment: Attachment limit exceeded",
    );
  });
});
