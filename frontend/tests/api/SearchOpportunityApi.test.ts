import { JSONRequestBody } from "../../src/app/api/BaseApi";
import SearchOpportunityAPI from "../../src/app/api/SearchOpportunityAPI";

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
      // Call the function under test
      const response = await searchApi.searchOpportunities();

      const method = "POST";
      const headers = baseRequestHeaders;

      const body: JSONRequestBody = {
        pagination: {
          order_by: "opportunity_id",
          page_offset: 1,
          page_size: 25,
          sort_direction: "ascending",
        },
      };

      const expectedUrl = `${searchApi.version}${searchApi.basePath}/${searchApi.namespace}/search`;

      expect(fetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method,
          headers,
          body: JSON.stringify(body),
        }),
      );

      expect(response).toEqual({
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
        warnings: [],
      });
    });
  });
});
