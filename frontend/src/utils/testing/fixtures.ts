import { PaginationInfo } from "src/types/apiResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import {
  PaginationOrderBy,
  PaginationSortDirection,
  QueryParamData,
  SearchFetcherActionType,
  ValidSearchQueryParamData,
} from "src/types/search/searchRequestTypes";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

export const mockOpportunity: BaseOpportunity = {
  opportunity_id: 12345,
  opportunity_title: "Test Opportunity",
  opportunity_status: "posted",
  summary: {
    archive_date: "2023-01-01",
    close_date: "2023-02-01",
    post_date: "2023-01-15",
    agency_name: "Test Agency",
    award_ceiling: 50000,
    award_floor: 10000,
  },
  opportunity_number: "OPP-12345",
} as BaseOpportunity;

export const searchFetcherParams: QueryParamData = {
  page: 1,
  status: new Set(["forecasted", "posted"]),
  fundingInstrument: new Set(["grant", "cooperative_agreement"]),
  agency: new Set(),
  category: new Set(),
  eligibility: new Set(),
  query: "research",
  sortby: "opportunityNumberAsc",
  actionType: "fun" as SearchFetcherActionType,
  fieldChanged: "baseball",
};

export const arbitrarySearchPagination = {
  sort_order: [
    {
      order_by: "opportunity_number" as PaginationOrderBy,
      sort_direction: "ascending" as PaginationSortDirection,
    },
  ],
  page_offset: 1,
  page_size: 25,
};

const fakeSearchFilterRequestBody = {
  opportunity_status: { one_of: ["Archived"] },
  funding_instrument: { one_of: ["Cooperative Agreement"] },
  applicant_type: { one_of: ["Individuals"] },
  agency: { one_of: ["Economic Development Administration"] },
  funding_category: { one_of: ["Recovery Act"] },
};

export const fakeSavedSearch = {
  filters: fakeSearchFilterRequestBody,
  pagination: arbitrarySearchPagination,
  query: "something to search for",
};

export const fakeSearchQueryParamData: ValidSearchQueryParamData = {
  query: "search term",
  status: "forecasted,closed",
  fundingInstrument: "Cooperative Agreement",
  eligibility: "Individuals",
  agency: "Economic Development Administration",
  category: "Recovery Act",
  page: "1",
  sortby: "relevancy",
};

const fakePaginationInfo: PaginationInfo = {
  order_by: "opportunity_number",
  page_offset: 1,
  page_size: 10,
  sort_direction: "ascending",
  total_pages: 1,
  total_records: 10,
};

export const fakeFacetCounts = {
  opportunity_status: {
    posted: 1,
    forecasted: 1,
  },
  funding_instrument: {
    arbitraryKey: 1,
  },
  applicant_type: {
    arbitraryKey: 1,
  },
  agency: {
    arbitraryKey: 1,
  },
  funding_category: {
    arbitraryKey: 1,
  },
};

export const fakeSearchAPIResponse: SearchAPIResponse = {
  data: [
    mockOpportunity,
    { ...mockOpportunity, opportunity_status: "forecasted" },
  ],
  pagination_info: fakePaginationInfo,
  facet_counts: fakeFacetCounts,
  message: "anything",
  status_code: 200,
};
