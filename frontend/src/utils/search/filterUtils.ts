import {
  allFilterOptions,
  sortOptions,
} from "src/constants/searchFilterOptions";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import {
  FilterOption,
  FilterPillLabelData,
  FrontendFilterNames,
  HardcodedFrontendFilterNames,
  RelevantAgencyRecord,
  searchFilterNames,
} from "src/types/search/searchFilterTypes";
import { ValidSearchQueryParam } from "src/types/search/searchQueryTypes";
import { QueryParamData } from "src/types/search/searchRequestTypes";

export const optionsForSearchParamKey = (
  key: ValidSearchQueryParam,
  agencyOptions: FilterOption[],
): FilterOption[] => {
  switch (key) {
    case "agency":
    case "topLevelAgency":
      return agencyOptions;
    case "assistanceListingNumber":
      return [];
    case "sortby":
      return sortOptions;
    default:
      return allFilterOptions[key as HardcodedFrontendFilterNames];
  }
};

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

// picks top level agencies off of individual sub agency records and moves them to
// the top level in order to provide a full flattened list of top level and sub agencies
export const flattenAgencies = (agencies: RelevantAgencyRecord[]) => {
  return agencies.reduce((allAgencies, agency) => {
    const agenciesToAdd = [agency];
    if (
      agency.top_level_agency &&
      !allAgencies.find(
        ({ agency_code }) =>
          agency.top_level_agency?.agency_code === agency_code,
      )
    ) {
      agenciesToAdd.push(agency.top_level_agency);
    }
    return allAgencies.concat(agenciesToAdd);
  }, [] as RelevantAgencyRecord[]);
};

const isTopLevelAgency = (agency: RelevantAgencyRecord) => {
  return !agency.agency_code.includes("-");
};

export const floatTopLevelAgencies = (agencies: RelevantAgencyRecord[]) => {
  // this should put all parent agencies at the top of the list to make it simpler to nest
  return agencies.sort((a, b) => {
    // when the agency code does not contain a dash we know we're dealing with a top level agency
    if (isTopLevelAgency(a) && !isTopLevelAgency(b)) {
      return -1;
    }
    if (!isTopLevelAgency(a) && isTopLevelAgency(b)) {
      return 1;
    }
    return 0;
  });
};

export const agencyToFilterOption = (
  agency: RelevantAgencyRecord,
): FilterOption => ({
  id: agency.agency_code,
  label: agency.agency_name,
  value: agency.agency_code,
});

// translates API response containing flat list of agencies into nested filter options
export const agenciesToNestedFilterOptions = (
  agenciesWithTopLevelAgenciesFloated: RelevantAgencyRecord[],
): FilterOption[] => {
  return agenciesWithTopLevelAgenciesFloated.reduce((acc, rawAgency) => {
    const agencyOption = agencyToFilterOption(rawAgency);
    if (isTopLevelAgency(rawAgency)) {
      return [...acc, agencyOption];
    }
    const parent = acc.find(
      (agency: FilterOption) =>
        agency.id === rawAgency.top_level_agency?.agency_code,
    );
    // parent should always already exist in the list because of the pre-sort, if it doesn't just skip the agency
    if (!parent) {
      console.error(
        `Parent agency not found: ${rawAgency.top_level_agency?.agency_code || "undefined"}`,
      );
      return acc;
    }
    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(agencyOption);
    return acc;
  }, [] as FilterOption[]);
};

export const agenciesToSortedAndNestedFilterOptions = (
  agencies: RelevantAgencyRecord[],
) => {
  try {
    const floated = floatTopLevelAgencies(agencies);
    return sortFilterOptions(agenciesToNestedFilterOptions(floated));
  } catch (e) {
    console.error("Unable to sort, convert and nest agency filter options", e);
    return [];
  }
};

export const agenciesToSortedFilterOptions = (
  agencies: RelevantAgencyRecord[],
) => {
  try {
    return sortFilterOptions(agencies.map(agencyToFilterOption));
  } catch (e) {
    console.error("Unable to sort and convert agency filter options", e);
    return [];
  }
};

// look up filter option label based on filter option value
export const getFilterOptionLabel = (
  value: string,
  options: FilterOption[],
) => {
  const option = options.find((option) => option.value === value);
  if (!option) {
    console.error(`Label not found for ${value}`);
    return "";
  }
  return option.label;
};

// return the correct pill label for a given query key and value
// TODO: build in translation for prefixes
// Since this is outside of a component we'd need to add interpolation markers and translate downstream
export const formatPillLabel = (
  queryParamKey: FrontendFilterNames,
  value: string,
  options: FilterOption[],
): string => {
  switch (queryParamKey) {
    case "costSharing":
      return `Cost sharing: ${getFilterOptionLabel(value, options)}`;
    case "closeDate":
      return `Closing within ${value} days`;
    case "assistanceListingNumber":
      return `ALN ${value}`;
    case "fundingInstrument":
      if (value === "other") {
        return "Other - Funding instrument";
      }
      return getFilterOptionLabel(value, options);
    case "eligibility":
      if (value === "other") {
        return "Other - Eligibility";
      }
      return getFilterOptionLabel(value, options);
    case "category":
      if (value === "other") {
        return "Other - Category";
      }
      return getFilterOptionLabel(value, options);
    default:
      return getFilterOptionLabel(value, options);
  }
};

// return pill label objects for all query params
export const formatPillLabels = (
  searchParams: QueryParamData,
  agencyOptions: FilterOption[],
): FilterPillLabelData[] => {
  return Object.entries(searchParams).reduce(
    (acc: FilterPillLabelData[], [key, values]: [string, Set<string>]) => {
      if (
        !searchFilterNames.includes(key as FrontendFilterNames) ||
        !values.size
      ) {
        return acc;
      }

      const queryParamKey = key as FrontendFilterNames;
      const availableOptions =
        key === "agency" || key === "topLevelAgency"
          ? agencyOptions
          : key === "assistanceListingNumber"
            ? []
            : allFilterOptions[key as HardcodedFrontendFilterNames];
      const pillLabels = Array.from(values).map((value) => ({
        label: formatPillLabel(queryParamKey, value, availableOptions),
        queryParamKey,
        queryParamValue: value,
      }));
      return acc.concat(pillLabels);
    },
    [],
  );
};

// finds human readable agency name by agency code in list of agency filter options
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
