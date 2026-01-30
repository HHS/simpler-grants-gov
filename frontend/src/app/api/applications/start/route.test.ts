/**
 * @jest-environment node
 */

import { startApplicationHandler } from "src/app/api/applications/start/handler";
import type {
  ApplicationStartApiResponse,
  StartApplicationFetcherOptions,
} from "src/types/applicationResponseTypes";

import { NextRequest } from "next/server";

const getSessionMock: jest.MockedFunction<
  () => Promise<{ token: string } | null>
> = jest.fn();

const handleStartApplicationMock: jest.MockedFunction<
  (
    options: StartApplicationFetcherOptions,
  ) => Promise<ApplicationStartApiResponse>
> = jest.fn();

type StartApplicationRouteRequestBody = {
  competitionId: string | null;
  applicationName: string | null;
  organizationId?: string;
  intendsToAddOrganization?: boolean;
};

const fakeRequestStartApp = (
  requestBody: StartApplicationRouteRequestBody,
  method: string,
) => {
  return {
    json: jest.fn(() => Promise.resolve(requestBody)),
    method,
  } as unknown as NextRequest;
};

jest.mock("src/services/auth/session", () => ({
  getSession: () => getSessionMock(),
}));

jest.mock("src/services/fetch/fetchers/applicationFetcher", () => ({
  handleStartApplication: (options: StartApplicationFetcherOptions) =>
    handleStartApplicationMock(options),
}));

describe("POST request", () => {
  afterEach(() => jest.clearAllMocks());

  it("starts application", async () => {
    getSessionMock.mockResolvedValue({ token: "fakeToken" });

    handleStartApplicationMock.mockResolvedValue({
      status_code: 200,
      message: "ok",
      data: { application_id: "5" },
    } as ApplicationStartApiResponse);

    const response = await startApplicationHandler(
      fakeRequestStartApp(
        {
          competitionId: "1",
          applicationName: "Test Application",
          intendsToAddOrganization: true,
        },
        "POST",
      ),
    );

    const json = (await response.json()) as {
      message: string;
      applicationId: string;
    };

    expect(response.status).toBe(200);
    expect(json.applicationId).toBe("5");
    expect(json.message).toBe("Application start success");

    expect(handleStartApplicationMock).toHaveBeenCalledTimes(1);
    expect(handleStartApplicationMock).toHaveBeenCalledWith({
      applicationName: "Test Application",
      competitionId: "1",
      token: "fakeToken",
      organizationId: undefined,
      intendsToAddOrganization: true,
    });
  });

  it("returns 401 when there is no session", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await startApplicationHandler(
      fakeRequestStartApp(
        {
          competitionId: "1",
          applicationName: "Test Application",
        },
        "POST",
      ),
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 when competitionId is missing", async () => {
    getSessionMock.mockResolvedValue({ token: "fakeToken" });

    const response = await startApplicationHandler(
      fakeRequestStartApp(
        {
          competitionId: null,
          applicationName: "Test Application",
        },
        "POST",
      ),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when applicationName is missing", async () => {
    getSessionMock.mockResolvedValue({ token: "fakeToken" });

    const response = await startApplicationHandler(
      fakeRequestStartApp(
        {
          competitionId: "1",
          applicationName: null,
        },
        "POST",
      ),
    );

    expect(response.status).toBe(400);
  });
});
