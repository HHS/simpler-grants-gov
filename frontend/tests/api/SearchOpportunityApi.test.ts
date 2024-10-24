import SearchOpportunityAPI, {
  buildFilters,
  buildPagination,
} from "src/app/api/SearchOpportunityAPI";
import {
  QueryParamData,
  SearchFetcherActionType,
} from "src/types/search/searchRequestTypes";

const validMockedResponse = {
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
};

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

let searchApi: SearchOpportunityAPI;
const mockedRequest = jest.fn();

describe("SearchOpportunityAPI", () => {
  beforeEach(() => {
    searchApi = new SearchOpportunityAPI();
    jest.spyOn(searchApi, "request").mockImplementation(mockedRequest);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("instantiates correctly", () => {
    expect(searchApi.namespace).toEqual("opportunities");
  });

  describe("searchOpportunities", () => {
    it("calls request function with correct parameters", async () => {
      mockedRequest.mockImplementation(() =>
        Promise.resolve(validMockedResponse),
      );
      const result = await searchApi.searchOpportunities(searchProps);

      expect(mockedRequest).toHaveBeenCalledWith(
        "POST",
        "search",
        searchProps,
        {
          pagination: {
            order_by: "opportunity_number", // This should be the actual value being used in the API method
            page_offset: 1,
            page_size: 25,
            sort_direction: "ascending", // or "descending" based on your sortby parameter
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
      );

      expect(result).toEqual(validMockedResponse);
    });
  });

  describe("buildFilters", () => {
    it("maps all params to the correct filter names", () => {
      const filters = buildFilters({
        ...searchProps,
        ...{
          agency: new Set(["agency 1", "agency 2"]),
          category: new Set(["category 1", "category 2"]),
          eligibility: new Set(["applicant type 1", "applicant type 2"]),
        },
      });
      expect(filters.opportunity_status).toEqual({
        one_of: ["forecasted", "posted"],
      });
      expect(filters.funding_instrument).toEqual({
        one_of: ["grant", "cooperative_agreement"],
      });
      expect(filters.applicant_type).toEqual({
        one_of: ["applicant type 1", "applicant type 2"],
      });
      expect(filters.agency).toEqual({
        one_of: ["agency 1", "agency 2"],
      });
      expect(filters.funding_category).toEqual({
        one_of: ["category 1", "category 2"],
      });
    });
    it("does not add filters where params are absent", () => {
      const filters = buildFilters(searchProps);
      expect(filters.opportunity_status).toEqual({
        one_of: ["forecasted", "posted"],
      });
      expect(filters.funding_instrument).toEqual({
        one_of: ["grant", "cooperative_agreement"],
      });
      expect(filters.applicant_type).toEqual(undefined);
      expect(filters.agency).toEqual(undefined);
      expect(filters.funding_category).toEqual(undefined);
    });
  });

  describe("buildPagination", () => {
    it("builds correct pagination with defaults", () => {
      const pagination = buildPagination({
        ...searchProps,
        ...{ page: 5, sortby: null },
      });

      expect(pagination.order_by).toEqual("post_date");
      expect(pagination.page_offset).toEqual(5);
      expect(pagination.sort_direction).toEqual("descending");
    });

    it("builds correct offset based on action type and field changed", () => {
      const pagination = buildPagination({
        ...searchProps,
        ...{ page: 5, actionType: SearchFetcherActionType.Update },
      });

      expect(pagination.page_offset).toEqual(1);

      const secondPagination = buildPagination({
        ...searchProps,
        ...{ page: 5, actionType: SearchFetcherActionType.InitialLoad },
      });

      expect(secondPagination.page_offset).toEqual(5);

      const thirdPagination = buildPagination({
        ...searchProps,
        ...{
          page: 5,
          actionType: SearchFetcherActionType.Update,
          fieldChanged: "pagination",
        },
      });

      expect(thirdPagination.page_offset).toEqual(5);

      const fourthPagination = buildPagination({
        ...searchProps,
        ...{
          page: 5,
          actionType: SearchFetcherActionType.Update,
          fieldChanged: "not_pagination",
        },
      });

      expect(fourthPagination.page_offset).toEqual(1);
    });

    it("builds correct order_by based on sortby", () => {
      const pagination = buildPagination({
        ...searchProps,
        ...{ sortby: "closeDate" },
      });

      expect(pagination.order_by).toEqual("close_date");

      const secondPagination = buildPagination({
        ...searchProps,
        ...{ sortby: "postedDate" },
      });

      expect(secondPagination.order_by).toEqual("post_date");
    });

    it("builds correct sort_direction based on sortby", () => {
      const pagination = buildPagination({
        ...searchProps,
        ...{ sortby: "opportunityNumberDesc" },
      });

      expect(pagination.sort_direction).toEqual("descending");

      const secondPagination = buildPagination({
        ...searchProps,
        ...{ sortby: "postedDateAsc" },
      });

      expect(secondPagination.sort_direction).toEqual("ascending");

      const thirdPagination = buildPagination({
        ...searchProps,
        ...{ sortby: null },
      });

      expect(thirdPagination.sort_direction).toEqual("descending");
    });
  });
});
