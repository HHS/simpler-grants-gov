import {
  SavedSearchQuery,
  SearchFetcherActionType,
} from "src/types/search/searchRequestTypes";
import {
  buildFilters,
  buildPagination,
  formatSearchRequestBody,
  paginationToSortby,
  searchToQueryParams,
} from "src/utils/search/searchFormatUtils";
import {
  fakeSavedSearch,
  searchFetcherParams,
} from "src/utils/testing/fixtures";

describe("formatSearchRequestBody", () => {
  it("does not add filters if no filters are present", () => {
    const formatted = formatSearchRequestBody({
      ...searchFetcherParams,
      fundingInstrument: new Set(),
      status: new Set(),
    });
    expect(formatted.filters).toEqual(undefined);
  });

  it("adds query string to top level of object", () => {
    const formatted = formatSearchRequestBody(searchFetcherParams);
    expect(formatted.query).toEqual("research");
  });

  it("creates object with filters and pagination", () => {
    const formatted = formatSearchRequestBody(searchFetcherParams);
    expect(formatted.pagination).toEqual({
      page_offset: 1,
      page_size: 25,
      sort_order: [
        {
          order_by: "opportunity_number",
          sort_direction: "ascending",
        },
      ],
    });
    expect(formatted.filters).toEqual({
      opportunity_status: { one_of: ["forecasted", "posted"] },
      funding_instrument: { one_of: ["grant", "cooperative_agreement"] },
    });
  });
});

describe("buildFilters", () => {
  it("maps all params to the correct filter names", () => {
    const filters = buildFilters({
      ...searchFetcherParams,
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
    const filters = buildFilters(searchFetcherParams);
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
      ...searchFetcherParams,
      ...{ page: 5, sortby: null },
    });

    expect(pagination.sort_order[0].order_by).toEqual("relevancy");
    expect(pagination.page_offset).toEqual(5);
    expect(pagination.sort_order[0].sort_direction).toEqual("descending");
  });

  it("builds correct offset based on action type and field changed", () => {
    const pagination = buildPagination({
      ...searchFetcherParams,
      ...{ page: 5, actionType: SearchFetcherActionType.Update },
    });

    expect(pagination.page_offset).toEqual(1);

    const secondPagination = buildPagination({
      ...searchFetcherParams,
      ...{ page: 5, actionType: SearchFetcherActionType.InitialLoad },
    });

    expect(secondPagination.page_offset).toEqual(5);

    const thirdPagination = buildPagination({
      ...searchFetcherParams,
      ...{
        page: 5,
        actionType: SearchFetcherActionType.Update,
        fieldChanged: "pagination",
      },
    });

    expect(thirdPagination.page_offset).toEqual(5);

    const fourthPagination = buildPagination({
      ...searchFetcherParams,
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
      ...searchFetcherParams,
      ...{ sortby: "closeDateAsc" },
    });

    expect(pagination.sort_order[0].order_by).toEqual("close_date");

    const secondPagination = buildPagination({
      ...searchFetcherParams,
      ...{ sortby: "postedDateAsc" },
    });

    expect(secondPagination.sort_order[0].order_by).toEqual("post_date");
  });

  it("builds correct sort_direction based on sortby", () => {
    const pagination = buildPagination({
      ...searchFetcherParams,
      ...{ sortby: "opportunityNumberDesc" },
    });

    expect(pagination.sort_order[0].sort_direction).toEqual("descending");

    const secondPagination = buildPagination({
      ...searchFetcherParams,
      ...{ sortby: "postedDateAsc" },
    });

    expect(secondPagination.sort_order[0].sort_direction).toEqual("ascending");

    const thirdPagination = buildPagination({
      ...searchFetcherParams,
      ...{ sortby: null },
    });

    expect(thirdPagination.sort_order[0].sort_direction).toEqual("descending");
  });
});

describe("searchToQueryParams", () => {
  it("translates filters properly and passes along query string", () => {
    const queryParams = searchToQueryParams(fakeSavedSearch);
    expect(queryParams.query).toEqual("something to search for");
    expect(queryParams.agency).toEqual("Economic Development Administration");
    expect(queryParams.category).toEqual("Recovery Act");
    expect(queryParams.eligibility).toEqual("Individuals");
    expect(queryParams.fundingInstrument).toEqual("Cooperative Agreement");
    expect(queryParams.status).toEqual("Archived");
  });
  it("comma separates multiple values", () => {
    const queryParams = searchToQueryParams({
      ...fakeSavedSearch,
      filters: { opportunity_status: { one_of: ["Archived", "Closed"] } },
    });
    expect(queryParams.status).toEqual("Archived,Closed");
  });
  it("does not break if no filters are present", () => {
    const queryParams = searchToQueryParams({
      ...fakeSavedSearch,
      filters: {},
    });
    expect(queryParams.query).toEqual("something to search for");

    const emptyQueryParams = searchToQueryParams({} as SavedSearchQuery);
    expect(emptyQueryParams).toEqual({ query: "" });
  });
});

describe("paginationToSortBy", () => {
  it("returns early if ordering by default relevancy", () => {
    expect(
      paginationToSortby([
        { order_by: "relevancy", sort_direction: "ascending" },
      ]),
    ).toEqual({});
  });
  it("returns early if the backend sort order can't be translated into a frontend one", () => {
    expect(
      paginationToSortby([
        { order_by: "opportunity_id", sort_direction: "ascending" },
        { order_by: "post_date", sort_direction: "ascending" },
      ]),
    ).toEqual({});
  });
  it("returns translation of first ordering with direction appended", () => {
    expect(
      paginationToSortby([
        { order_by: "top_level_agency_name", sort_direction: "ascending" },
        { order_by: "agency_name", sort_direction: "ascending" },
      ]),
    ).toEqual({ sortby: "agencyAsc" });
  });
});
