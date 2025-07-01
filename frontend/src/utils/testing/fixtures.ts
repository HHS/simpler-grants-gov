import { PaginationInfo } from "src/types/apiResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import {
  FilterOption,
  FilterPillLabelData,
  RelevantAgencyRecord,
} from "src/types/search/searchFilterTypes";
import { ValidSearchQueryParamData } from "src/types/search/searchQueryTypes";
import {
  PaginationOrderBy,
  PaginationSortDirection,
  QueryParamData,
  SearchAPIResponse,
  SearchFetcherActionType,
} from "src/types/search/searchRequestTypes";

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
  closeDate: new Set(),
  costSharing: new Set(),
  topLevelAgency: new Set(),
  query: "research",
  sortby: "opportunityNumberAsc",
  actionType: "fun" as SearchFetcherActionType,
  fieldChanged: "baseball",
  andOr: "OR",
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
  close_date: {
    arbitraryKey: 1,
  },
  is_cost_sharing: {
    true: 1,
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

export const fakeOpportunityDocument = {
  file_name: "your_file_thanks.mp3",
  download_path: "http://big-website.net/your_file_again.mp4",
  updated_at: Date.now().toString(),
  file_description: "a description for your file",
};

export const initialFilterOptions: FilterOption[] = [
  {
    id: "funding-instrument-cooperative_agreement",
    label: "Cooperative Agreement",
    value: "cooperative_agreement",
  },
  {
    id: "funding-instrument-grant",
    label: "Grant",
    value: "grant",
  },
  {
    id: "funding-instrument-procurement_contract",
    label: "Procurement Contract ",
    value: "procurement_contract",
  },
  {
    id: "funding-instrument-other",
    label: "Other",
    value: "other",
  },
];
export const filterOptionsWithChildren = [
  {
    id: "AGNC",
    label: "Top Level Agency",
    value: "AGNC",
    children: [
      {
        id: "AGNC-KID",
        label: "Kid",
        value: "AGNC-KID",
      },
      {
        id: "AGNC-CHILD",
        label: "Child",
        value: "AGNC-CHILD",
      },
    ],
  },
  {
    id: "DOC-NIST",
    label: "National Institute of Standards and Technology",
    value: "DOC-NIST",
    children: [
      {
        id: "HI",
        label: "Hello",
        value: "HI",
      },
      {
        id: "There",
        label: "Again",
        value: "There",
      },
    ],
  },
  {
    id: "MOCK-NIST",
    label: "Mational Institute",
    value: "MOCK-NIST",
  },
  {
    id: "MOCK-TRASH",
    label: "Mational TRASH",
    value: "MOCK-TRASH",
    children: [
      {
        id: "TRASH",
        label: "More TRASH",
        value: "TRASH",
      },
    ],
  },
  {
    id: "FAKE",
    label: "Completely fake",
    value: "FAKE",
  },
];

export const fakeAttachments = [
  {
    created_at: "2007-11-02T15:23:09+00:00",
    download_path:
      "https://d3t9pc32v5noin.cloudfront.net/opportunities/40009/attachments/25293/YLP_Algeria_RFGP_09-28-07_EDITED.doc",
    file_description: "Announcement",
    file_name: "YLP_Algeria_RFGP_09-28-07_EDITED.doc",
    file_size_bytes: 111616,
    mime_type: "application/msword",
    updated_at: "2007-11-02T15:23:09+00:00",
  },
  {
    created_at: "2007-11-02T15:23:10+00:00",
    download_path:
      "https://d3t9pc32v5noin.cloudfront.net/opportunities/40009/attachments/25294/YLP_Algeria_POGI_09-26-07_EDITED.doc",
    file_description: "Mandatory POGI",
    file_name: "YLP_Algeria_POGI_09-26-07_EDITED.doc",
    file_size_bytes: 122880,
    mime_type: "application/msword",
    updated_at: "2007-11-02T15:23:10+00:00",
  },
];

export const fakeAgencyResponseData: RelevantAgencyRecord[] = [
  {
    agency_code: "DOCNIST",
    agency_name: "National Institute of Standards and Technology",
    top_level_agency: null,
    agency_id: 1,
  },
  {
    agency_code: "MOCKNIST",
    agency_name: "Mational Institute",
    top_level_agency: null,
    agency_id: 1,
  },
  {
    agency_code: "MOCKTRASH",
    agency_name: "Mational TRASH",
    top_level_agency: null,
    agency_id: 1,
  },
  {
    agency_code: "FAKEORG",
    agency_name: "Completely fake",
    top_level_agency: null,
    agency_id: 1,
  },
];

export const fakeAgencyResponseDataWithTopLevel: RelevantAgencyRecord[] = [
  {
    agency_code: "DOC-DOCNIST",
    agency_name: "National Institute of Standards and Technology",
    top_level_agency: {
      agency_code: "DOC",
      agency_name: "Detroit Optical Company",
      agency_id: 11,
      top_level_agency: null,
    },
    agency_id: 1,
  },
  {
    agency_code: "MOCK-NIST",
    agency_name: "Mational Institute",
    top_level_agency: {
      agency_code: "MOCK",
      agency_name: "A mock",
      agency_id: 12,
      top_level_agency: null,
    },
    agency_id: 2,
  },
  {
    agency_code: "MOCKTRASH",
    agency_name: "Mational TRASH",
    top_level_agency: {
      agency_code: "MOCK",
      agency_name: "A mock",
      agency_id: 12,
      top_level_agency: null,
    },
    agency_id: 3,
  },
  {
    agency_code: "FAKEORG",
    agency_name: "Completely fake",
    top_level_agency: null,
    agency_id: 4,
  },
];

export const fakeSearchParamDict = {
  status: "forecasted,posted,archived,closed",
  eligibility: "state_governments",
  query: "simpler",
  category: "recovery_act",
  agency: "CPSC",
  fundingInstrument: "cooperative_agreement",
  andOr: "OR",
  sortby: "closeDateAsc",
};

export const fakeResponsiveTableHeaders = [
  { cellData: "hi" },
  { cellData: "a heading" },
  { cellData: "table header cell" },
];

export const fakeResponsiveTableRows = [
  [
    { cellData: "hi from row one", stackOrder: 1 },
    { cellData: "i am column two", stackOrder: 0 },
    { cellData: "some data", stackOrder: -1 },
  ],
  [
    { cellData: "hi from row two", stackOrder: 1 },
    { cellData: "still column two", stackOrder: 0 },
    { cellData: "some more data", stackOrder: -1 },
  ],
  [
    { cellData: "hi from row three", stackOrder: 1 },
    { cellData: "column two", stackOrder: 0 },
    { cellData: "even more data", stackOrder: -1 },
  ],
];

export const fakeFilterPillLabelData: FilterPillLabelData[] = [
  {
    label: "whatever",
    queryParamKey: "status",
    queryParamValue: "whichever",
  },
  {
    label: "another",
    queryParamKey: "category",
    queryParamValue: "overHere",
  },
  {
    label: "this one.",
    queryParamKey: "agency",
    queryParamValue: "that one!",
  },
  {
    label: "last",
    queryParamKey: "eligibility",
    queryParamValue: "again",
  },
];
