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

const VALID_PENDING_FILE_ID = "11111111-1111-4111-8111-111111111111";

describe("POST request", () => {
  beforeEach(() => {
    getSessionMock.mockReturnValue({ token: "fakeToken" });
  });
  afterEach(() => jest.clearAllMocks());

  it("creates the application attachment and returns it", async () => {
    mockCreateApplicationAttachment.mockResolvedValue({ data: attachment });

    const response = await createApplicationAttachmentHandler(
      fakeRequest({ pending_file_id: VALID_PENDING_FILE_ID }),
      options,
    );

    expect(response.status).toBe(200);
    expect((await readJson(response)).data).toEqual(attachment);
    expect(mockCreateApplicationAttachment).toHaveBeenCalledWith(
      "app-123",
      VALID_PENDING_FILE_ID,
    );
  });

  it("accepts an uppercase uuid and trims surrounding whitespace", async () => {
    mockCreateApplicationAttachment.mockResolvedValue({ data: attachment });

    const response = await createApplicationAttachmentHandler(
      fakeRequest({
        pending_file_id: `  ${VALID_PENDING_FILE_ID.toUpperCase()}  `,
      }),
      options,
    );

    expect(response.status).toBe(200);
    expect(mockCreateApplicationAttachment).toHaveBeenCalledWith(
      "app-123",
      VALID_PENDING_FILE_ID.toUpperCase(),
    );
  });

  it("returns 401 when the session has no token", async () => {
    getSessionMock.mockReturnValue({ token: "" });

    const response = await createApplicationAttachmentHandler(
      fakeRequest({ pending_file_id: VALID_PENDING_FILE_ID }),
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

  describe("pending_file_id validation", () => {
    const invalidBodies: [string, unknown][] = [
      ["missing", {}],
      ["undefined", { pending_file_id: undefined }],
      ["null", { pending_file_id: null }],
      ["empty string", { pending_file_id: "" }],
      ["whitespace only", { pending_file_id: "   " }],
      ["malformed uuid", { pending_file_id: "not-a-uuid" }],
      ["uuid with extra characters", { pending_file_id: `${"1".repeat(40)}` }],
      [
        "uuid missing a segment",
        { pending_file_id: "11111111-1111-4111-111111111111" },
      ],
      ["number", { pending_file_id: 12345 }],
      ["boolean", { pending_file_id: true }],
      ["array", { pending_file_id: [VALID_PENDING_FILE_ID] }],
      ["object", { pending_file_id: { id: VALID_PENDING_FILE_ID } }],
      ["body is an array", [{ pending_file_id: VALID_PENDING_FILE_ID }]],
      ["body is a string", "pending_file_id"],
      ["body is null", null],
    ];

    it.each(invalidBodies)(
      "returns 400 without calling the API when pending_file_id is %s",
      async (_label, body) => {
        const response = await createApplicationAttachmentHandler(
          fakeRequest(body),
          options,
        );

        expect(response.status).toBe(400);
        expect((await readJson(response)).message).toBe(
          "Invalid pending_file_id",
        );
        expect(mockCreateApplicationAttachment).not.toHaveBeenCalled();
      },
    );
  });

  describe("failure sanitization", () => {
    it("does not return an internal error message to the browser", async () => {
      mockCreateApplicationAttachment.mockRejectedValue(
        new Error("connect ECONNREFUSED 10.0.0.4:8080 while calling /v1/apply"),
      );

      const response = await createApplicationAttachmentHandler(
        fakeRequest({ pending_file_id: VALID_PENDING_FILE_ID }),
        options,
      );

      expect(response.status).toBe(500);
      const { message } = await readJson(response);
      expect(message).toBe("Error failed to upload attachment");
      expect(message).not.toContain("ECONNREFUSED");
      expect(message).not.toContain("10.0.0.4");
    });

    it.each([[401], [403], [404], [422], [500], [503]])(
      "preserves upstream status %s while sanitizing the message",
      async (status) => {
        mockCreateApplicationAttachment.mockRejectedValue(
          new ApiRequestError(
            `upstream detail for ${status}`,
            "APIRequestError",
            status,
          ),
        );

        const response = await createApplicationAttachmentHandler(
          fakeRequest({ pending_file_id: VALID_PENDING_FILE_ID }),
          options,
        );

        expect(response.status).toBe(status);
        expect((await readJson(response)).message).toBe(
          "Error failed to upload attachment",
        );
      },
    );
  });
});
