/**
 * @jest-environment node
 */
import { updateApplicationIncludeFormInSubmissionHandler } from "src/app/api/applications/[applicationId]/forms/[formId]/handler";

const getSessionMock = jest.fn();
const mockUpdateApplicationFormIncludeInSubmission = jest.fn();

jest.mock("src/services/fetch/fetchers/applicationFetcher", () => ({
  handleUpdateApplicationFormIncludeInSubmission: (
    applicationId: string,
    formId: string,
    is_included_in_submission: boolean,
    token: string,
  ) =>
    mockUpdateApplicationFormIncludeInSubmission(
      applicationId,
      formId,
      is_included_in_submission,
      token,
    ) as unknown,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

describe("PUT request", () => {
  const mockParams = Promise.resolve({
    applicationId: "app123",
    formId: "form456",
  });

  const mockRequest = (body: object) =>
    ({
      json: jest.fn().mockResolvedValue(body),
    }) as unknown as Request;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns success response when update is successful", async () => {
    getSessionMock.mockResolvedValue({ token: "token123" });
    mockUpdateApplicationFormIncludeInSubmission.mockResolvedValue({
      status_code: 200,
      data: {
        is_included_in_submission: true,
      },
    });

    const req = mockRequest({ is_included_in_submission: true });
    const response = await updateApplicationIncludeFormInSubmissionHandler(
      req,
      { params: mockParams },
    );
    const json = (await response.json()) as unknown;

    expect(getSessionMock).toHaveBeenCalled();
    expect(mockUpdateApplicationFormIncludeInSubmission).toHaveBeenCalledWith(
      "app123",
      "form456",
      true,
      "token123",
    );

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message: "Application form inclusions update submit success",
      is_included_in_submission: true,
    });
  });

  it("throws UnauthorizedError if no session token", async () => {
    getSessionMock.mockResolvedValue(null);

    const req = mockRequest({ is_included_in_submission: false });
    const response = await updateApplicationIncludeFormInSubmissionHandler(
      req,
      { params: mockParams },
    );
    const json = (await response.json()) as { message: string };

    expect(response.status).toBe(401);
    expect(json.message).toMatch(
      /No active session to update including form in application submission/,
    );
    expect(getSessionMock).toHaveBeenCalled();
  });

  it("returns error if API response is not 200", async () => {
    getSessionMock.mockResolvedValue({ token: "token123" });
    mockUpdateApplicationFormIncludeInSubmission.mockResolvedValue({
      status_code: 400,
      message: "Invalid update",
    });

    const req = mockRequest({ is_included_in_submission: false });
    const response = await updateApplicationIncludeFormInSubmissionHandler(
      req,
      { params: mockParams },
    );
    const json = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(json.message).toMatch(/Error attempting to update include form/);
  });
});
