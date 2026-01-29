import { uniq } from "lodash";
import {
  SEARCH_NO_STATUS_VALUE,
  STATUS_FILTER_DEFAULT_VALUES,
} from "src/constants/search";
import { statusOptions } from "src/constants/searchFilterOptions";
import { OptionalStringDict } from "src/types/generalTypes";
import { FilterOption } from "src/types/search/searchFilterTypes";
import { QuerySetParam } from "src/types/search/searchQueryTypes";
import {
  QueryOperator,
  QueryParamData,
  SearchFetcherActionType,
} from "src/types/search/searchRequestTypes";
import { SortOptions } from "src/types/search/searchSortTypes";

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
    closeDate: paramToDateRange(params.closeDate),
    postedDate: paramToDateRange(params.postedDate),
    costSharing: paramToSet(params.costSharing),
    andOr: (params.andOr as QueryOperator) || "",
    topLevelAgency: paramToSet(params.topLevelAgency),
    sortby: (params.sortby as SortOptions) || null, // Convert empty string to null if needed
    assistanceListingNumber: paramToSet(
      params.assistanceListingNumber as QuerySetParam,
    ),

    // Ensure page is at least 1 or default to 1 if undefined
    page: getSafePage(params.page),
    actionType: SearchFetcherActionType.InitialLoad,
  };
}

// Helper function to convert query parameters to set
// and to reset that status params none if status=none is set
function paramToSet(param: QuerySetParam, type?: string): Set<string> {
  if (!param && type === "status") {
    return new Set(STATUS_FILTER_DEFAULT_VALUES);
  }

  if (!param || (type === "status" && param === SEARCH_NO_STATUS_VALUE)) {
    return new Set();
  }

  if (Array.isArray(param)) {
    return new Set(param);
  }
  return new Set(param.split(","));
}

// for now, assuming that param values represent "number of days from the current day"
export function paramToDateRange(paramValue?: string): Set<string> {
  if (!paramValue) {
    return new Set();
  }
  const selectedDates = paramValue.split(",");
  // for relativeDates
  if (selectedDates.length === 1) {
    return new Set([selectedDates[0]]);
  }
  // for absolute dates, unused at the moment
  return new Set([selectedDates[0], selectedDates[1]]);
}

// Keeps page >= 1.
// (We can't enforce a max here since this is before the API request)
function getSafePage(page: string | undefined) {
  return Math.max(1, parseInt(page || "1"));
}

// stringifies query params, unencrypts any encrypted commas, and prepends a ?
export const paramsToFormattedQuery = (params: URLSearchParams): string => {
  if (!params.size) {
    return "";
  }
  // return `?${params.toString().replaceAll("%2C", ",")}`;
  return `?${decodeURIComponent(params.toString())}`;
};

export const getAgencyParent = (agencyCode: string) => agencyCode.split("-")[0];

// for now this assumes that child values will be prefixed with the parent's code (as is true for agencies)
// a more robust but slower implementation with full traversal can be done later if need be
export const getSiblingOptionValues = (
  value: string,
  options: FilterOption[],
): string[] => {
  const parentCode = getAgencyParent(value);
  const parent = options.find((option) => option.value === parentCode);
  return parent?.children
    ? parent.children.reduce((acc, child) => {
        if (child.value !== value) {
          acc.push(child.value);
        }
        return acc;
      }, [] as string[])
    : [];
};

// defaults will already have been applied upstream
export const getStatusValueForAgencySearch = (statuses?: string[]) => {
  // if empty - apply any / all
  if (!statuses?.length) {
    return statusOptions.map(({ value }) => value);
  }
  // always include posted and forecasted
  return uniq(statuses.concat(STATUS_FILTER_DEFAULT_VALUES));
};
