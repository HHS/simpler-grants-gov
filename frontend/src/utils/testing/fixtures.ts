import {
  QueryParamData,
  SearchFetcherActionType,
} from "src/types/search/searchRequestTypes";
import { Opportunity } from "src/types/search/searchResponseTypes";

export const mockOpportunity: Opportunity = {
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
} as Opportunity;

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
