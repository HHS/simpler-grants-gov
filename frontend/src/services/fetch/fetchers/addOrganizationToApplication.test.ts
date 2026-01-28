import { ApiRequestError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { fetchApplicationWithMethod } from "src/services/fetch/fetchers/fetchers";

import { addOrganizationToApplication } from "./addOrganizationToApplication";

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn(),
}));

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchApplicationWithMethod: jest.fn(),
}));

const getSessionMock = getSession as jest.Mock;
const fetchApplicationWithMethodMock = fetchApplicationWithMethod as jest.Mock;

type FetchApplicationInvoker = (options: {
  subPath?: string;
  additionalHeaders?: Record<string, string>;
}) => Promise<Response>;

function createResponse({
  ok,
  status,
  jsonBody,
}: {
  ok: boolean;
  status: number;
  jsonBody?: unknown;
}): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(jsonBody),
    headers: new Headers({ "Content-Type": "application/json" }),
  } as unknown as Response;
}

describe("addOrganizationToApplication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws UnauthorizedError when there is no active session", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    await expect(
      addOrganizationToApplication({
        applicationId: "app-123",
        organizationId: "org-123",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("calls fetchApplicationWithMethod(PUT) with expected subPath and headers", async () => {
    getSessionMock.mockResolvedValueOnce({ token: "token-value" });

    const requestInvokerMock = jest.fn<Promise<Response>, [unknown]>();
    requestInvokerMock.mockResolvedValueOnce(
      createResponse({
        ok: true,
        status: 200,
        jsonBody: { message: "Success", data: { application_id: "app-123" } },
      }),
    );

    fetchApplicationWithMethodMock.mockReturnValueOnce(
      requestInvokerMock as unknown as FetchApplicationInvoker,
    );

    await addOrganizationToApplication({
      applicationId: "app-123",
      organizationId: "org-123",
    });

    expect(fetchApplicationWithMethod).toHaveBeenCalledWith("PUT");
    expect(requestInvokerMock).toHaveBeenCalledWith({
      subPath: "app-123/organizations/org-123",
      additionalHeaders: { "X-SGG-Token": "token-value" },
    });
  });

  it("throws ApiRequestError when response is not ok", async () => {
    getSessionMock.mockResolvedValueOnce({ token: "token-value" });

    const requestInvokerMock = jest.fn<Promise<Response>, [unknown]>();
    requestInvokerMock.mockResolvedValueOnce(
      createResponse({ ok: false, status: 404 }),
    );

    fetchApplicationWithMethodMock.mockReturnValueOnce(
      requestInvokerMock as unknown as FetchApplicationInvoker,
    );

    await expect(
      addOrganizationToApplication({
        applicationId: "app-123",
        organizationId: "org-123",
      }),
    ).rejects.toBeInstanceOf(ApiRequestError);
  });

  it("returns parsed json when response is ok", async () => {
    getSessionMock.mockResolvedValueOnce({ token: "token-value" });

    const expectedBody = {
      message: "Success",
      data: { application_id: "app-123" },
    };

    const requestInvokerMock = jest.fn<Promise<Response>, [unknown]>();
    requestInvokerMock.mockResolvedValueOnce(
      createResponse({ ok: true, status: 200, jsonBody: expectedBody }),
    );

    fetchApplicationWithMethodMock.mockReturnValueOnce(
      requestInvokerMock as unknown as FetchApplicationInvoker,
    );

    const result = await addOrganizationToApplication({
      applicationId: "app-123",
      organizationId: "org-123",
    });

    expect(result).toEqual(expectedBody);
  });
});
