import { SEARCH_NO_STATUS_VALUE } from "src/constants/search";
import { OptionalStringDict } from "src/types/generalTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import {
  QueryParamData,
  QuerySetParam,
  SearchFetcherActionType,
  SortOptions,
} from "src/types/search/searchRequestTypes";

import { FilterOption } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

export const alphabeticalOptionSort = (
  firstOption: FilterOption,
  secondOption: FilterOption,
) => firstOption.label.localeCompare(secondOption.label);

// alphabetically sorts nested and top level filter options
export const sortFilterOptions = (
  filterOptions: FilterOption[],
): FilterOption[] => {
  const childrenSorted = filterOptions.map((option) => {
    if (option.children) {
      return {
        ...option,
        children: option.children.toSorted(alphabeticalOptionSort),
      };
    }
    return option;
  });
  return childrenSorted.toSorted(alphabeticalOptionSort);
};

// finds human readable agency name by agency code in list of agency filter options
// agency options will come in pre-flattened
export const getAgencyDisplayName = (opportunity: BaseOpportunity): string => {
  if (
    opportunity.top_level_agency_name &&
    opportunity.agency_name &&
    opportunity.top_level_agency_name !== opportunity.agency_name
  ) {
    return `${opportunity.top_level_agency_name} - ${opportunity.agency_name}`;
  }

  return opportunity.agency_name || opportunity.agency_code || "--";
};

export const areSetsEqual = (a: Set<string>, b: Set<string>) =>
  a.size === b.size && [...a].every((value) => b.has(value));

// Search params (query string) coming from the request URL into the server
// can be a string, string[], or undefined.
// Process all of them so they're just a string (or number for page)

// The above doesn't seem to still be true, should we update? - DWS
export function convertSearchParamsToProperTypes(
  params: OptionalStringDict,
): QueryParamData {
  return {
    ...params,
    query: params.query || "", // Convert empty string to null if needed
    status: paramToSet(params.status, "status"),
    fundingInstrument: paramToSet(params.fundingInstrument),
    eligibility: paramToSet(params.eligibility),
    agency: paramToSet(params.agency),
    category: paramToSet(params.category),
    sortby: (params.sortby as SortOptions) || null, // Convert empty string to null if needed

    // Ensure page is at least 1 or default to 1 if undefined
    page: getSafePage(params.page),
    actionType: SearchFetcherActionType.InitialLoad,
  };
}

// Helper function to convert query parameters to set
// and to reset that status params none if status=none is set
function paramToSet(param: QuerySetParam, type?: string): Set<string> {
  if (!param && type === "status") {
    return new Set(["forecasted", "posted"]);
  }

  if (!param || (type === "status" && param === SEARCH_NO_STATUS_VALUE)) {
    return new Set();
  }

  if (Array.isArray(param)) {
    return new Set(param);
  }
  return new Set(param.split(","));
}

// Keeps page >= 1.
// (We can't enforce a max here since this is before the API request)
function getSafePage(page: string | undefined) {
  return Math.max(1, parseInt(page || "1"));
}
