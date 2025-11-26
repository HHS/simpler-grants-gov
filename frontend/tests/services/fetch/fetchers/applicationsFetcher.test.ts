import {
  fetchApplications,
  getApplications,
} from "src/services/fetch/fetchers/applicationsFetcher";

const fetchUserMock = jest.fn();
const fetchUserWithMethodMock = jest.fn();
const mockGetSession = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchUserWithMethod: (type: string) =>
    fetchUserWithMethodMock(type) as unknown,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

describe("getApplications", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchUserWithMethod as expected and returns json result", async () => {
    fetchUserMock.mockReturnValue({
      json: () => ({ data: [{ fake: "applications" }] }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);
    const result = await getApplications("faketoken", "1");

    expect(result).toEqual([{ fake: "applications" }]);
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/applications",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
      body: {
        pagination: {
          page_offset: 1,
          page_size: 5000,
          sort_order: [
            {
              order_by: "created_at",
              sort_direction: "descending",
            },
          ],
        },
      },
    });
  });
});

describe("fetchApplications", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchApplications as expected and returns json result", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken", user_id: "1" });
    fetchUserMock.mockReturnValue({
      json: () => ({ data: [{ fake: "applications" }] }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);
    const result = await fetchApplications();

    expect(result).toEqual([{ fake: "applications" }]);
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/applications",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
      body: {
        pagination: {
          page_offset: 1,
          page_size: 5000,
          sort_order: [
            {
              order_by: "created_at",
              sort_direction: "descending",
            },
          ],
        },
      },
    });
  });

  it("returns an error if user session is not present", async () => {
    mockGetSession.mockResolvedValue({});

    await expect(fetchApplications()).rejects.toThrow();
  });
});
