import { MissingAuthError } from "src/errors";
import {
  APPLICATIONS_PAGE_SIZE,
  fetchApplications,
  fetchApplicationsPage,
  getApplications,
} from "src/services/fetch/fetchers/userApplicationsFetcher";

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
    const result = await getApplications("1");

    expect(result).toEqual([{ fake: "applications" }]);
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/applications",
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

  it("throws MissingAuthError if user token is not present", async () => {
    mockGetSession.mockResolvedValue({});

    await expect(fetchApplications()).rejects.toThrow(MissingAuthError);
  });
});

describe("fetchApplicationsPage", () => {
  afterEach(() => jest.resetAllMocks());

  const paginatedResponse = {
    data: [{ fake: "applications" }],
    pagination_info: {
      page_offset: 2,
      page_size: 25,
      total_pages: 3,
      total_records: 60,
      order_by: "created_at",
      sort_direction: "descending",
    },
  };

  it("requests the given page with the default page size and returns data with pagination info", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken", user_id: "1" });
    fetchUserMock.mockReturnValue({ json: () => paginatedResponse });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);

    const result = await fetchApplicationsPage(2);

    expect(APPLICATIONS_PAGE_SIZE).toBe(25);
    expect(result).toEqual(paginatedResponse);
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/applications",
      body: {
        pagination: {
          page_offset: 2,
          page_size: 25,
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

  it("supports a custom page size", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken", user_id: "1" });
    fetchUserMock.mockReturnValue({ json: () => paginatedResponse });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);

    await fetchApplicationsPage(1, 10);

    expect(fetchUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          pagination: expect.objectContaining({
            page_offset: 1,
            page_size: 10,
          }) as unknown,
        }) as unknown,
      }),
    );
  });

  it("throws MissingAuthError if user token is not present", async () => {
    mockGetSession.mockResolvedValue({});

    await expect(fetchApplicationsPage(1)).rejects.toThrow(MissingAuthError);
  });
});
