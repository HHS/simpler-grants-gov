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

  describe("getSearchOpportunities", () => {
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
      const response = await searchApi.getSearchOpportunities(queryParams);

      expect(fetch).toHaveBeenCalledWith(
        `${process.env.apiUrl as string}/search/opportunities?keyword=science`,
        {
          method: "GET",
          headers: baseRequestHeaders,
          body: null,
        }
      );
      expect(response.data).toEqual({ opportunities: [] });
      expect(1).toBe(1);
    });
  });
});
