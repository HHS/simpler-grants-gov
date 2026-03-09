import { UnauthorizedError } from "src/errors";
import {
  fetchUserAgencies,
  getUserAgencies,
} from "src/services/fetch/fetchers/userAgenciesFetcher";

type FetchArgs = {
  subPath: string;
  additionalHeaders: Record<string, string>;
  body?: unknown;
};

type FetchResponse = {
  ok: boolean;
  status: number;
  json: () => unknown;
};

type FetchImpl = (args: FetchArgs) => FetchResponse;
type FetchWithMethodFn = (type: string) => FetchImpl;
type GetSessionFn = () => Promise<unknown>;

const fetchUserMock = jest.fn<FetchResponse, [FetchArgs]>();
const fetchUserWithMethodMock = jest.fn<FetchImpl, [string]>();
const mockGetSession = jest.fn<ReturnType<GetSessionFn>, []>();

jest.mock("src/services/fetch/fetchers/fetchers", () => {
  const mocked: {
    fetchUserWithMethod: FetchWithMethodFn;
  } = {
    fetchUserWithMethod: (type: string) => fetchUserWithMethodMock(type),
  };
  return mocked;
});

jest.mock("src/services/auth/session", () => {
  const mocked: { getSession: GetSessionFn } = {
    getSession: () => mockGetSession(),
  };
  return mocked;
});

describe("getUserAgencies", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns json data when response is ok", async () => {
    fetchUserMock.mockReturnValue({
      ok: true,
      status: 200,
      json: () => ({
        data: [
          {
            agency_id: "agency-1",
            agency_name: "Agency One",
            agency_code: "AGY1",
          },
        ],
      }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);

    const result = await getUserAgencies("faketoken", "user-1");

    expect(result).toEqual([
      {
        agency_id: "agency-1",
        agency_name: "Agency One",
        agency_code: "AGY1",
      },
    ]);
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "user-1/agencies",
      additionalHeaders: { "X-SGG-Token": "faketoken" },
      body: {},
    });
  });

  it("throws UnauthorizedError when response is 401", async () => {
    fetchUserMock.mockReturnValue({
      ok: false,
      status: 401,
      json: () => ({ message: "unauthorized" }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);

    await expect(getUserAgencies("faketoken", "user-1")).rejects.toEqual(
      expect.objectContaining({
        message: "Unauthorized",
      }),
    );
  });

  it("throws generic error on non-401 non-ok responses", async () => {
    fetchUserMock.mockReturnValue({
      ok: false,
      status: 500,
      json: () => ({ message: "server error" }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);

    await expect(getUserAgencies("faketoken", "user-1")).rejects.toThrow(
      "Failed to fetch user agencies: 500",
    );
  });
});

describe("fetchUserAgencies", () => {
  afterEach(() => jest.resetAllMocks());

  it("throws UnauthorizedError when session is missing", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(fetchUserAgencies()).rejects.toEqual(
      expect.objectContaining({
        message: "No active session",
      }),
    );
  });
});
