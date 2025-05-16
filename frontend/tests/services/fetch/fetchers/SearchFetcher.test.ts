import {
  downloadOpportunities,
  searchForOpportunities,
} from "src/services/fetch/fetchers/searchFetcher";
import {
  QueryParamData,
  SearchAPIResponse,
} from "src/types/search/searchRequestTypes";
import { searchFetcherParams } from "src/utils/testing/fixtures";

const mockFetchOpportunitySearch = jest.fn().mockResolvedValue({
  json: () => ({
    data: {},
  }),
  body: { data: {} },
});

const mockFormatSearchRequestBody = jest.fn();

mockFormatSearchRequestBody.mockReturnValue({
  filters: {
    opportunity_status: {
      one_of: ["forecasted", "posted"],
    },
    funding_instrument: {
      one_of: ["grant", "cooperative_agreement"],
    },
  },
  pagination: {
    sort_order: [
      {
        order_by: "opportunity_number",
        sort_direction: "ascending",
      },
    ], // This should be the actual value being used in the API method
    page_offset: 1,
    page_size: 25,
  },
  query: "research",
});

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchOpportunitySearch: (params: QueryParamData) => {
    return mockFetchOpportunitySearch(params) as SearchAPIResponse;
  },
}));

jest.mock("src/utils/search/searchFormatUtils", () => ({
  formatSearchRequestBody: (...args: unknown[]) =>
    mockFormatSearchRequestBody(...args) as unknown,
}));

describe("searchForOpportunities", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("calls request function with correct parameters and returns json data from response", async () => {
    const result = await searchForOpportunities(searchFetcherParams);

    expect(mockFormatSearchRequestBody).toHaveBeenCalledWith(
      searchFetcherParams,
    );
    expect(mockFetchOpportunitySearch).toHaveBeenCalledWith({
      body: {
        pagination: {
          sort_order: [
            {
              order_by: "opportunity_number",
              sort_direction: "ascending",
            },
          ], // This should be the actual value being used in the API method
          page_offset: 1,
          page_size: 25,
        },
        query: "research",
        filters: {
          opportunity_status: {
            one_of: ["forecasted", "posted"],
          },
          funding_instrument: {
            one_of: ["grant", "cooperative_agreement"],
          },
        },
      },
    });

    expect(result).toEqual({
      actionType: "fun",
      data: {},
      fieldChanged: "baseball",
    });
  });
});

describe("downloadOpportunities", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("calls request function with correct parameters and returns response", async () => {
    const result = await downloadOpportunities(searchFetcherParams);

    expect(mockFetchOpportunitySearch).toHaveBeenCalledWith({
      body: {
        pagination: {
          sort_order: [
            {
              order_by: "opportunity_number", // This should be the actual value being used in the API method
              sort_direction: "ascending", // or "descending" based on your sortby parameter
            },
          ],
          page_offset: 1,
          page_size: 5000,
        },
        query: "research",
        filters: {
          opportunity_status: {
            one_of: ["forecasted", "posted"],
          },
          funding_instrument: {
            one_of: ["grant", "cooperative_agreement"],
          },
        },
        format: "csv",
      },
    });

    expect(result).toEqual({
      data: {},
    });
  });
});
