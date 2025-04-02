/**
 * @jest-environment node
 */

import { POST } from "src/app/api/applications/start/route";

const getSessionMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

const mockPostStartApp = jest.fn((): unknown =>
  Promise.resolve({ status_code: 200, data: { application_id: 5 } }),
);

jest.mock("src/services/fetch/fetchers/applicationFetcher", () => ({
  handleStartApplication: () => mockPostStartApp(),
}));

describe("POST and DELETE request", () => {
  afterEach(() => jest.clearAllMocks());
  it("saves saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await POST();
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
