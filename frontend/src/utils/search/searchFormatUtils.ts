import { pickBy } from "lodash";
import { OptionalStringDict } from "src/types/generalTypes";
import {
  ValidSearchQueryParamData,
  validSearchQueryParamKeys,
} from "src/types/search/searchQueryTypes";
import {
  BooleanFilter,
  OneOfFilter,
  PaginationOrderBy,
  PaginationRequestBody,
  PaginationSortOrder,
  QueryParamData,
  RelativeDateRangeFilter,
  SavedSearchQuery,
  SearchFetcherActionType,
  SearchFilterRequestBody,
  SearchRequestBody,
} from "src/types/search/searchRequestTypes";

const orderByFieldLookup = {
  relevancy: ["relevancy"],
  opportunityNumber: ["opportunity_number"],
  opportunityTitle: ["opportunity_title"],
  agency: ["top_level_agency_name", "agency_name"],
  postedDate: ["post_date"],
  closeDate: ["close_date"],
  awardFloor: ["award_floor"],
  awardCeiling: ["award_ceiling"],
};

const filterConfigurations = [
  {
    frontendName: "status",
    backendName: "opportunity_status",
    dataType: "oneOf",
  },
  {
    frontendName: "fundingInstrument",
    backendName: "funding_instrument",
    dataType: "oneOf",
  },
  {
    frontendName: "eligibility",
    backendName: "applicant_type",
    dataType: "oneOf",
  },
  {
    frontendName: "agency",
    backendName: "agency",
    dataType: "oneOf",
  },
  {
    frontendName: "category",
    backendName: "funding_category",
    dataType: "oneOf",
  },
  {
    frontendName: "closeDate",
    backendName: "close_date",
    dataType: "dateRange",
  },
  {
    frontendName: "costSharing",
    backendName: "is_cost_sharing",
    dataType: "boolean",
  },
  {
    frontendName: "topLevelAgency",
    backendName: "top_level_agency",
    dataType: "oneOf",
  },
  {
    frontendName: "assistanceListingNumber",
    backendName: "assistance_listing_number",
    dataType: "oneOf",
  },
] as const;

const toOneOfFilter = (data: Set<string>): OneOfFilter => {
  return {
    one_of: Array.from(data),
  };
};

const toRelativeDateRangeFilter = (
  data: Set<string>,
): RelativeDateRangeFilter => {
  const convertedData = Array.from(data);
  return {
    end_date_relative: convertedData[0],
  };
};

// comes in as Set but should have only one entry, take the first
const toBooleanFilter = (data: Set<string>): BooleanFilter => ({
  one_of: [Array.from(data)[0] === "true"],
});

const fromOneOfFilter = (data: OneOfFilter): string =>
  data?.one_of?.length ? data.one_of.join(",") : "";

const fromRelativeDateRangeFilter = (data: RelativeDateRangeFilter): string =>
  data?.end_date_relative;

const fromBooleanFilter = (data: BooleanFilter): string => {
  if (!data?.one_of?.length) {
    return "";
  }
  return data.one_of[0] ? "true" : "false";
};

const backendFilterToQueryParamValue = (
  backendFilterData: OneOfFilter | RelativeDateRangeFilter | BooleanFilter,
  dataType: "oneOf" | "boolean" | "dateRange",
) => {
  switch (dataType) {
    case "oneOf":
      return fromOneOfFilter(backendFilterData as OneOfFilter);
    case "dateRange":
      return fromRelativeDateRangeFilter(
        backendFilterData as RelativeDateRangeFilter,
      );
    case "boolean":
      return fromBooleanFilter(backendFilterData as BooleanFilter);
  }
};

// transforms raw query param data into structured search object format that the API needs
export const formatSearchRequestBody = (searchInputs: QueryParamData) => {
  const { query, andOr } = searchInputs;

  const filters = buildFilters(searchInputs);
  const pagination = buildPagination(searchInputs);

  const requestBody: SearchRequestBody = { pagination };

  // Only add filters if there are some
  if (Object.keys(filters).length > 0) {
    requestBody.filters = filters;
  }

  if (query) {
    requestBody.query = query;
  }
  if (andOr) {
    requestBody.query_operator = andOr;
  }
  return requestBody;
};

// filter out any query params that are not specifically expected for search
export const filterSearchParams = (
  params: OptionalStringDict,
): ValidSearchQueryParamData => {
  return pickBy(params, (_value, key) =>
    (validSearchQueryParamKeys as readonly string[]).includes(key),
  );
};

// Translate frontend filter param names to expected backend parameter names
// implicitly filters out any unexpected params from searchInputs
export const buildFilters = (
  searchInputs: QueryParamData,
): SearchFilterRequestBody => {
  return Object.entries(searchInputs).reduce(
    (requestBody, [queryKey, queryValue]: [string, Set<string>]) => {
      if (!queryValue || !queryValue.size) {
        return requestBody;
      }
      const config = filterConfigurations.find(
        (config) => config.frontendName === queryKey,
      );
      if (!config) {
        return requestBody;
      }
      const { dataType, backendName } = config;
      if (dataType === "oneOf") {
        requestBody[backendName] = toOneOfFilter(queryValue);
      } else if (dataType === "dateRange") {
        requestBody[backendName] = toRelativeDateRangeFilter(queryValue);
      } else if (dataType === "boolean") {
        requestBody[backendName] = toBooleanFilter(queryValue);
      }
      return requestBody;
    },
    {} as SearchFilterRequestBody,
  );
};

// sort of the opposite of buildFilters - translates from backend search object to query param object
export const searchToQueryParams = (
  searchRecord: SavedSearchQuery,
): ValidSearchQueryParamData => {
  const filters =
    searchRecord.filters && Object.keys(searchRecord.filters).length
      ? Object.entries(searchRecord.filters).reduce(
          (
            queryParams,
            [backendKey, backendFilterData]: [
              string,
              OneOfFilter | RelativeDateRangeFilter | BooleanFilter,
            ],
          ) => {
            const config = filterConfigurations.find(
              (config) => config.backendName === backendKey,
            );
            if (!config) {
              console.error(
                "Bad search query configuration, key not found",
                backendKey,
              );
              return queryParams;
            }

            const queryParamValue = backendFilterToQueryParamValue(
              backendFilterData,
              config.dataType,
            );
            if (queryParamValue) {
              queryParams[
                config.frontendName as keyof ValidSearchQueryParamData
              ] = queryParamValue;
            }
            return queryParams;
          },
          {} as ValidSearchQueryParamData,
        )
      : {};

  const sortby = paginationToSortby(searchRecord?.pagination?.sort_order || []);
  const withQueryAndSort = {
    ...filters,
    query: searchRecord.query || "",
    ...sortby,
  };
  return searchRecord.query && searchRecord.query_operator
    ? { ...withQueryAndSort, andOr: searchRecord.query_operator }
    : withQueryAndSort;
};

// sort of the opposite of buildPagination - translates from backend search pagination object to "sortby" query param
export const paginationToSortby = (
  sortOrder: PaginationSortOrder,
): ValidSearchQueryParamData => {
  // relevancy is default so no need to specify a param here
  if (
    !sortOrder[0] ||
    !sortOrder[0].order_by ||
    sortOrder[0].order_by === "relevancy"
  ) {
    return {};
  }

  // an array of sort order field tuples, of shape [<frontend sort field name>, [<backend sort field name>]]
  const paginationSortOrderFields = sortOrder.map((entry) => entry.order_by);

  const sortFieldMapping = Object.entries(orderByFieldLookup).find(
    ([_frontend, backend]) => {
      return (
        backend.length === paginationSortOrderFields.length &&
        backend.every(
          (field, index) => paginationSortOrderFields[index] === field,
        )
      );
    },
  );

  if (!sortFieldMapping) {
    console.error(
      "Cannot convert backend pagination sort to query param. Sort order not found",
      paginationSortOrderFields,
    );
    return {};
  }

  // just taking the first sorting option for now
  const sortFieldName = sortFieldMapping[0];

  const directionSuffix =
    sortOrder[0].sort_direction === "descending" ? "Desc" : "Asc";

  return {
    sortby: `${sortFieldName}${directionSuffix}`,
  };
};

export const buildPagination = (
  searchInputs: QueryParamData,
): PaginationRequestBody => {
  const { sortby, page, fieldChanged } = searchInputs;

  // When performing an update (query, filter, sortby change) - we want to
  // start back at the 1st page (we never want to retain the current page).
  // In addition to this statement - on the client (handleSubmit in useSearchFormState), we
  // clear the page query param and set the page back to 1.
  // On initial load (SearchFetcherActionType.InitialLoad) we honor the page the user sent. There is validation guards
  // in convertSearchParamsToProperTypes that keep 1<= page <= max_possible_page
  const page_offset =
    searchInputs.actionType === SearchFetcherActionType.Update &&
    fieldChanged !== "pagination"
      ? 1
      : page;

  let sort_order: PaginationSortOrder = [
    { order_by: "relevancy", sort_direction: "descending" },
    { order_by: "close_date", sort_direction: "ascending" },
  ];

  if (sortby) {
    sort_order = [];
    // this will need to change in a future where we allow the user to set an ordered set of sort columns.
    // for now we're just using the multiple internally behind a single column picker drop down so this is fine.
    for (const [key, value] of Object.entries(orderByFieldLookup)) {
      if (sortby.startsWith(key)) {
        const sort_direction =
          sortby && sortby.endsWith("Asc") ? "ascending" : "descending";
        value.forEach((item) => {
          sort_order.push({
            order_by: <PaginationOrderBy>item,
            sort_direction,
          });
          if (item === "relevancy") {
            sort_order.push({
              order_by: "post_date",
              sort_direction,
            });
          }
        });
      }
    }
  }

  return {
    page_offset,
    page_size: 25,
    sort_order,
  };
};
