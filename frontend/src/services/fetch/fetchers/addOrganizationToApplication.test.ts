import { ApiRequestError } from "src/errors";

import { addOrganizationToApplication } from "./addOrganizationToApplication";

const mockJsonFn = jest.fn();
const mockResponse = { json: mockJsonFn };
const mockFetcher = jest.fn().mockResolvedValue(mockResponse);
const mockFetchApplicationWithMethod = jest.fn((_args: unknown) => mockFetcher);
jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchApplicationWithMethod: (...args: unknown[]) =>
    mockFetchApplicationWithMethod(...(args as [unknown])),
}));

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

  it("calls fetchApplicationWithMethod(PUT) with expected subPath and headers", async () => {
    mockFetcher.mockResolvedValueOnce(
      createResponse({
        ok: true,
        status: 200,
        jsonBody: { message: "Success", data: { application_id: "app-123" } },
      }),
    );

    await addOrganizationToApplication({
      applicationId: "app-123",
      organizationId: "org-123",
    });

    expect(mockFetchApplicationWithMethod).toHaveBeenCalledWith("PUT");
    expect(mockFetcher).toHaveBeenCalledWith({
      subPath: "app-123/organizations/org-123",
    });
  });

  it("throws ApiRequestError when response is not ok", async () => {
    mockFetcher.mockResolvedValueOnce(
      createResponse({ ok: false, status: 404 }),
    );

    await expect(
      addOrganizationToApplication({
        applicationId: "app-123",
        organizationId: "org-123",
      }),
    ).rejects.toBeInstanceOf(ApiRequestError);
  });

  it("returns parsed json when response is ok", async () => {
    const expectedBody = {
      message: "Success",
      data: { application_id: "app-123" },
    };

    mockFetcher.mockResolvedValueOnce(
      createResponse({ ok: true, status: 200, jsonBody: expectedBody }),
    );

    const result = await addOrganizationToApplication({
      applicationId: "app-123",
      organizationId: "org-123",
    });

    expect(result).toEqual(expectedBody);
  });
});
