import { JSONRequestBody } from "../../src/api/BaseApi";
import SearchOpportunityAPI from "../../src/api/SearchOpportunityAPI";

const mockFetch = ({
  response = { data: { opportunities: [] }, errors: [], warnings: [] },
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
      global.fetch = mockFetch({
        response: {
          data: { opportunities: [] },
          errors: [],
          warnings: [],
        },
      });
    });

    it("sends GET request to search opportunities endpoint with query parameters", async () => {
      const queryParams = { keyword: "science" };

      const response = await searchApi.searchOpportunities(queryParams);

      const method = "POST";
      const headers = baseRequestHeaders;

      const body: JSONRequestBody = {
        pagination: {
          order_by: "opportunity_id",
          page_offset: 1,
          page_size: 25,
          sort_direction: "ascending",
        },
        ...queryParams,
      };

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method,
          headers,
          body: JSON.stringify(body),
        }),
      );
      expect(response.data).toEqual({ opportunities: [] });
    });
  });
});
