/**
 * @jest-environment node
 */

import { startApplicationHandler } from "src/app/api/applications/start/handler";

import { NextRequest } from "next/server";

const getSessionMock = jest.fn();

const fakeRequestStartApp = (success = true, method: string) => {
  return {
    json: jest.fn(() => {
      return success
        ? Promise.resolve({
            competitionId: "1",
            applicationName: "Test Application",
          })
        : Promise.resolve({ competitionId: null, applicationName: null });
    }),
    method,
  } as unknown as NextRequest;
};

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

const mockPostStartApp = jest.fn((): unknown =>
  Promise.resolve({ status_code: 200, data: { application_id: 5 } }),
);

jest.mock("src/services/fetch/fetchers/applicationFetcher", () => ({
  handleStartApplication: () => mockPostStartApp(),
}));

describe("POST request", () => {
  afterEach(() => jest.clearAllMocks());
  it("starts application", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));

    const response = await startApplicationHandler(
      fakeRequestStartApp(true, "POST"),
    );

    const json = (await response.json()) as {
      message: string;
      applicationId: string;
    };
    expect(response.status).toBe(200);
    expect(json.applicationId).toBe(5);

    expect(mockPostStartApp).toHaveBeenCalledTimes(1);
    expect(json.message).toBe("Application start success");
  });
});
