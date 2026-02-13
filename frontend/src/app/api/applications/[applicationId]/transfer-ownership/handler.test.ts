import { transferOwnershipHandler } from "src/app/api/applications/[applicationId]/transfer-ownership/handler";

type JsonResponseInit = { status?: number };

type MinimalResponse = {
  status: number;
  ok: boolean;
  json: () => Promise<unknown>;
};

const getSessionMock = jest.fn<Promise<{ token: string } | null>, []>();
const addOrganizationToApplicationMock = jest.fn<
  Promise<{ message: string; data: { application_id: string } }>,
  [{ applicationId: string; organizationId: string }]
>();

const nextResponseJsonMock = jest.fn<
  MinimalResponse,
  [unknown, JsonResponseInit | undefined]
>();

const createJsonResponse = (
  body: unknown,
  init?: JsonResponseInit,
): MinimalResponse => {
  const status = init?.status ?? 200;

  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  };
};

type NextResponseModuleMock = {
  NextResponse: {
    json: (body: unknown, init?: JsonResponseInit) => MinimalResponse;
  };
};

jest.mock(
  "next/server",
  (): NextResponseModuleMock => ({
    NextResponse: {
      json: (body: unknown, init?: JsonResponseInit) =>
        nextResponseJsonMock(body, init),
    },
  }),
);

jest.mock("src/services/auth/session", () => ({
  getSession: (): Promise<{ token: string } | null> => getSessionMock(),
}));

jest.mock("src/services/fetch/fetchers/addOrganizationToApplication", () => ({
  addOrganizationToApplication: (args: {
    applicationId: string;
    organizationId: string;
  }): Promise<{ message: string; data: { application_id: string } }> =>
    addOrganizationToApplicationMock(args),
}));

type FakeRequestBody = { organization_id?: string };

const createFakeRequest = (body: FakeRequestBody): Request =>
  ({
    json: () => Promise.resolve(body),
    method: "PUT",
  }) as unknown as Request;

describe("transferOwnershipHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    globalThis.Response = {
      json: (body: unknown, init?: { status?: number }) => {
        const status = init?.status ?? 200;

        return {
          status,
          ok: status >= 200 && status < 300,
          json: () => Promise.resolve(body),
        } as unknown as Response;
      },
    } as unknown as typeof Response;

    nextResponseJsonMock.mockImplementation((body, init) =>
      createJsonResponse(body, init),
    );
  });

  it("returns 401 when session is missing", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = (await transferOwnershipHandler(
      createFakeRequest({ organization_id: "org-123" }),
      { params: Promise.resolve({ applicationId: "app-123" }) },
    )) as unknown as MinimalResponse;

    expect(response.status).toBe(401);
  });

  it("returns 400 when organization_id is missing", async () => {
    getSessionMock.mockResolvedValueOnce({ token: "fakeToken" });

    const response = (await transferOwnershipHandler(createFakeRequest({}), {
      params: Promise.resolve({ applicationId: "app-123" }),
    })) as unknown as MinimalResponse;

    expect(response.status).toBe(400);
  });

  it("returns 200 and calls addOrganizationToApplication on success", async () => {
    getSessionMock.mockResolvedValueOnce({ token: "fakeToken" });

    addOrganizationToApplicationMock.mockResolvedValueOnce({
      message: "Success",
      data: { application_id: "app-123" },
    });

    const response = (await transferOwnershipHandler(
      createFakeRequest({ organization_id: "org-123" }),
      { params: Promise.resolve({ applicationId: "app-123" }) },
    )) as unknown as MinimalResponse;

    expect(addOrganizationToApplicationMock).toHaveBeenCalledTimes(1);
    expect(addOrganizationToApplicationMock).toHaveBeenCalledWith({
      applicationId: "app-123",
      organizationId: "org-123",
    });

    expect(response.status).toBe(200);

    const json = (await response.json()) as {
      message: string;
      data: { application_id: string };
    };

    expect(json.data.application_id).toBe("app-123");
  });

  it("returns 500 when addOrganizationToApplication throws", async () => {
    getSessionMock.mockResolvedValueOnce({ token: "fakeToken" });

    addOrganizationToApplicationMock.mockRejectedValueOnce(new Error("Boom"));

    const response = (await transferOwnershipHandler(
      createFakeRequest({ organization_id: "org-123" }),
      { params: Promise.resolve({ applicationId: "app-123" }) },
    )) as unknown as MinimalResponse;

    expect(response.status).toBe(500);
  });
});
