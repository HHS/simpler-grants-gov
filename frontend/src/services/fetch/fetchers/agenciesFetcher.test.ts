import {
  performAgencySearch,
  searchAndFlattenAgencies,
  getUserAgencies,
  fetchUserAgencies,
} from "src/services/fetch/fetchers/agenciesFetcher";
import { fakeAgencyResponseData } from "src/utils/testing/fixtures";
import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";

const fakeResponse = {
  json: () => Promise.resolve({ data: fakeAgencyResponseData }),
  status: 200,
};
const fakeSession = {
  token: "test-token",
  userId: "123-ABC",
};

const mockUserSession = jest.fn().mockResolvedValue(fakeSession);
const mockFetchAgencies = jest.fn().mockResolvedValue(fakeResponse);
const mockSearchAgencies = jest.fn().mockResolvedValue(fakeResponse);
const mockFlattenAgencies = jest.fn().mockReturnValue(fakeAgencyResponseData);
const mockGetStatusValueForAgencySearch = jest
  .fn()
  .mockReturnValue(["forecasted"]);

jest.mock("src/services/auth/session", () => ({
  getSession: (arg: unknown): unknown => mockUserSession(arg),
}));

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchAgencies: (arg: unknown): unknown => mockFetchAgencies(arg),
  searchAgencies: (arg: unknown): unknown => mockSearchAgencies(arg),
  fetchUserWithMethod: jest.fn(),   // Initialize as a mock -- this works
}));

jest.mock("src/utils/search/filterUtils", () => ({
  flattenAgencies: (arg: unknown): unknown => mockFlattenAgencies(arg),
}));

jest.mock("src/utils/search/searchUtils", () => ({
  getStatusValueForAgencySearch: (arg: unknown) =>
    mockGetStatusValueForAgencySearch(arg) as unknown,
}));

describe("performAgencySearch", () => {
  it("calls request function with correct parameters", async () => {
    const result = await performAgencySearch({
      keyword: "anything",
      selectedStatuses: ["forecasted"],
    });

    expect(mockSearchAgencies).toHaveBeenCalledWith({
      body: {
        filters: { opportunity_statuses: { one_of: ["forecasted"] } },
        pagination: {
          page_offset: 1,
          page_size: 1500,
          sort_order: [
            {
              order_by: "agency_code",
              sort_direction: "ascending",
            },
          ],
        },
        query: "anything",
      },
    });

    expect(result).toEqual(fakeAgencyResponseData);
  });
});

describe("searchAndFlattenAgencies", () => {
  beforeEach(() => {
    mockFetchAgencies.mockResolvedValue(fakeResponse);
    mockSearchAgencies.mockResolvedValue(fakeResponse);
    mockFlattenAgencies.mockReturnValue(fakeAgencyResponseData);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("calls fetch, and flattens", async () => {
    await searchAndFlattenAgencies("anything", ["forecasted"]);
    expect(mockSearchAgencies).toHaveBeenCalledWith({
      body: {
        pagination: {
          page_offset: 1,
          page_size: 1500, // 969 agencies in prod as of 3/7/25
          sort_order: [
            {
              order_by: "agency_code",
              sort_direction: "ascending",
            },
          ],
        },
        filters: { opportunity_statuses: { one_of: ["forecasted"] } },
        query: "anything",
      },
    });
    expect(mockFlattenAgencies).toHaveBeenCalledWith(fakeAgencyResponseData);
  });
});


// ------------------------------------------------------
// Fetch user's agencies
// ------------------------------------------------------
describe("getUserAgencies", () => {
  let mockJsonFn: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonFn = jest.fn();
    const mockResponse = { json: mockJsonFn };
    (fetchUserWithMethod as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockResponse),
    );
  });
  it("calls request function with correct parameters", async () => {
    const expectedResponse = {
      status_code: 200,
      data: fakeAgencyResponseData,
    };
    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await getUserAgencies(
      "test-token",
      "123-ABC",
    );

    expect(fetchUserWithMethod).toHaveBeenCalledWith("POST");
    expect(result).toEqual(fakeAgencyResponseData);
  });
});

describe("fetchUserAgencies", () => {
  let mockJsonFn: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonFn = jest.fn();
    const mockResponse = { json: mockJsonFn };
    (fetchUserWithMethod as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockResponse),
    );
    mockUserSession.mockResolvedValue(fakeSession);
  });
  it("checks user's session and calls getUserAgencies", async () => {
    const expectedResponse = {
      status_code: 200,
      data: fakeAgencyResponseData,
    };
    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await fetchUserAgencies();

    expect(fetchUserWithMethod).toHaveBeenCalledWith("POST");
    expect(mockUserSession).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeAgencyResponseData);
  });
});
