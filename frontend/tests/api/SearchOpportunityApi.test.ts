import SearchOpportunityAPI from "../../src/app/api/SearchOpportunityAPI";
import { QueryParamData } from "../../src/services/search/searchfetcher/SearchFetcher";
import { SearchRequestBody } from "../../src/types/search/searchRequestTypes";

// mockFetch should match the SearchAPIResponse type structure
const mockFetch = ({
  response = {
    data: [],
    message: "Success",
    pagination_info: {
      order_by: "opportunity_id",
      page_offset: 1,
      page_size: 25,
      sort_direction: "ascending",
      total_pages: 1,
      total_records: 0,
    },
    status_code: 200,
    errors: [],
    warnings: [],
  },
  ok = true,
  status = 200,
}) => {
  return jest.fn().mockResolvedValueOnce({
    json: jest.fn().mockResolvedValueOnce(response),
    ok,
    status,
  });
};

describe("SearchOpportunityAPI", () => {
  let searchApi: SearchOpportunityAPI;
  const baseRequestHeaders = {
    "Content-Type": "application/json",
  };

  beforeEach(() => {
    jest.resetAllMocks();

    searchApi = new SearchOpportunityAPI();
  });

  describe("searchOpportunities", () => {
    beforeEach(() => {
      global.fetch = mockFetch({});
    });

    it("sends POST request to search opportunities endpoint with query parameters", async () => {
      const searchProps: QueryParamData = {
        page: 1,
        status: new Set(["forecasted", "posted"]),
        fundingInstrument: new Set(["grant", "cooperative_agreement"]),
        agency: new Set(),
        category: new Set(),
        eligibility: new Set(),
        query: "research",
        sortby: "opportunityNumberAsc",
      };

      const response = await searchApi.searchOpportunities(searchProps);

      const method = "POST";
      const headers = baseRequestHeaders;

      const requestBody: SearchRequestBody = {
        pagination: {
          order_by: "opportunity_number", // This should be the actual value being used in the API method
          page_offset: 1,
          page_size: 25,
          sort_direction: "ascending", // or "descending" based on your sortby parameter
        },
        filters: {
          opportunity_status: {
            one_of: Array.from(searchProps.status),
          },
          funding_instrument: {
            one_of: Array.from(searchProps.fundingInstrument),
          },
        },
        query: searchProps.query || "",
      };

      const expectedUrl = `${searchApi.version}${searchApi.basePath}/${searchApi.namespace}/search`;

      expect(fetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method,
          headers,
          body: JSON.stringify(requestBody),
        }),
      );

      expect(response).toEqual({
        data: [],
        message: "Success",
        pagination_info: {
          // TODO: the response order_by should
          // by what the request had: opportunity_number
          order_by: "opportunity_id",
          page_offset: 1,
          page_size: 25,
          sort_direction: "ascending",
          total_pages: 1,
          total_records: 0,
        },
        status_code: 200,
        warnings: [],
      });
    });
  });
});
