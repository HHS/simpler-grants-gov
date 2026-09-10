import {
  SEARCH_NO_STATUS_VALUE,
  STATUS_FILTER_DEFAULT_VALUES,
} from "src/constants/search";
import {
  allFilterOptions,
  andOrOptions,
  sortOptions,
  statusOptions,
} from "src/constants/searchFilterOptions";
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

const validParamValues: { [key: string]: Set<string> } = {
  ...Object.entries(allFilterOptions).reduce(
    (acc, [filterName, options]) => {
      acc[filterName] = new Set(options.map(({ value }) => value));
      return acc;
    },
    {} as { [key: string]: Set<string> },
  ),
  status: new Set([
    ...statusOptions.map(({ value }) => value),
    SEARCH_NO_STATUS_VALUE,
  ]),
  sortby: new Set(sortOptions.map(({ value }) => value)),
  andOr: new Set(andOrOptions.map(({ value }) => value)),
};

// A repeated param (?status=posted&status=closed) arrives as a string[] rather than a string,
// so flatten it to the comma separated form the rest of the search code works with
const normalizeParamValue = (paramValue: QuerySetParam): string | undefined =>
  Array.isArray(paramValue) ? paramValue.join(",") : paramValue;

// Strips any values that aren't valid for the given param, returning the comma separated
// remainder, or undefined if nothing valid is left. Params with no known set of valid
// values are passed through untouched.
export const removeInvalidParamValues = (
  paramKey: string,
  paramValue: QuerySetParam,
): string | undefined => {
  const normalizedValue = normalizeParamValue(paramValue);
  const validValues = validParamValues[paramKey];
  if (!normalizedValue || !validValues) {
    return normalizedValue;
  }
  const validatedValues = normalizedValue
    .split(",")
    .filter((value) => validValues.has(value));
  return validatedValues.length ? validatedValues.join(",") : undefined;
};

// Builds a copy of the incoming search params with every value normalized to a string and all
// invalid filter values removed, reporting separately whether anything actually had to be removed.
const validateSearchParams = (params: { [key: string]: QuerySetParam }) => {
  let removedAnyValues = false;
  const validatedParams = Object.entries(params).reduce(
    (acc, [key, value]) => {
      const validatedValue = removeInvalidParamValues(key, value);
      // compare against the normalized value so that a repeated param doesn't count as a removal
      if (validatedValue !== normalizeParamValue(value)) {
        removedAnyValues = true;
      }
      if (validatedValue !== undefined) {
        acc[key] = validatedValue;
      }
      return acc;
    },
    {} as { [key: string]: string },
  );
  return { validatedParams, removedAnyValues };
};

// Returns the search params with all invalid filter values removed, or null when there was
// nothing to remove, so that callers can skip a needless redirect.
export const sanitizeSearchParams = (params: {
  [key: string]: QuerySetParam;
}): { [key: string]: string } | null => {
  const { validatedParams, removedAnyValues } = validateSearchParams(params);
  return removedAnyValues ? validatedParams : null;
};

// Search params (query string) coming from the request URL into the server
// can be a string, string[], or undefined.
// Process all of them so they're just a string (or number for page)

// The above doesn't seem to still be true, should we update? - DWS
export function convertSearchParamsToProperTypes(params: {
  [key: string]: QuerySetParam;
}): QueryParamData {
  // drop any filter values that don't exist so that a bad URL doesn't propagate, and take the
  // validated params unconditionally so that repeated params are always flattened to a string
  const { validatedParams: validParams } = validateSearchParams(params);
  return {
    ...validParams,
    query: validParams.query || "", // Convert empty string to null if needed
    status: paramToSet(validParams.status, "status"),
    fundingInstrument: paramToSet(validParams.fundingInstrument),
    eligibility: paramToSet(validParams.eligibility),
    agency: paramToSet(validParams.agency),
    category: paramToSet(validParams.category),
    closeDate: paramToDateRange(validParams.closeDate),
    postedDate: paramToDateRange(validParams.postedDate),
    costSharing: paramToSet(validParams.costSharing),
    andOr: (validParams.andOr as QueryOperator) || "",
    topLevelAgency: paramToSet(validParams.topLevelAgency),
    sortby: (validParams.sortby as SortOptions) || null, // Convert empty string to null if needed
    assistanceListingNumber: paramToSet(validParams.assistanceListingNumber),

    // Ensure page is at least 1 or default to 1 if undefined
    page: getSafePage(validParams.page),
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

// Keeps page >= 1, and falls back to 1 for a non numeric param value, which would
// otherwise send NaN through to the API and fail validation.
// (We can't enforce a max here since this is before the API request)
function getSafePage(page: string | undefined) {
  const parsedPage = parseInt(page || "1");
  return isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
}

// stringifies query params, unencrypts any encrypted commas, and prepends a ?
// note that only commas are decoded - decoding the whole string would turn an encoded
// reserved character inside a value (e.g. `&` or `#` in a search term) back into a
// delimiter, splitting one param into two
export const paramsToFormattedQuery = (params: URLSearchParams): string => {
  if (!params.size) {
    return "";
  }
  return `?${params.toString().replaceAll("%2C", ",")}`;
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
  return [...new Set(statuses.concat(STATUS_FILTER_DEFAULT_VALUES))];
};
