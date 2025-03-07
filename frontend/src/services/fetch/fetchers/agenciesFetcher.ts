"server only";

import { fetchAgencies } from "src/services/fetch/fetchers/fetchers";
import { sortFilterOptions } from "src/utils/search/searchUtils";

import { FilterOption } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

export interface RelevantAgencyRecord {
  agency_code: string;
  agency_id: number;
  agency_name: string;
  top_level_agency: null | {
    agency_code: string;
  };
}

const isTopLevelAgency = (agency: RelevantAgencyRecord) => {
  return !agency.agency_code.includes("-");
};

// would have called this getAgencies, but technically it's a POST
export const obtainAgencies = async (): Promise<RelevantAgencyRecord[]> => {
  const response = await fetchAgencies({
    body: {
      pagination: {
        page_offset: 1,
        page_size: 1500, // 969 agencies in prod as of 3/7/25
        sort_direction: "ascending",
        sort_order: [
          {
            order_by: "created_at",
            sort_direction: "ascending",
          },
        ],
      },
    },
    nextOptions: {
      revalidate: 604800,
    },
  });
  const { data } = (await response.json()) as { data: RelevantAgencyRecord[] };
  return data;
};

// translates API response containing flat list of agencies into nested filter options
export const agenciesToFilterOptions = (
  agencies: RelevantAgencyRecord[],
): FilterOption[] => {
  // this should put all parent agencies at the top of the list to make it simpler to nest
  const agenciesWithTopLevelAgenciesFloated = agencies.sort((a, b) => {
    // when the agency code does not contain a dash we know we're dealing with a top level agency
    if (isTopLevelAgency(a) && !isTopLevelAgency(b)) {
      return -1;
    }
    if (!isTopLevelAgency(a) && isTopLevelAgency(b)) {
      return 1;
    }
    return 0;
  });

  return agenciesWithTopLevelAgenciesFloated.reduce((acc, rawAgency) => {
    const agencyOption = {
      id: rawAgency.agency_code,
      label: rawAgency.agency_name,
      value: rawAgency.agency_code,
    };
    if (
      !rawAgency.top_level_agency ||
      rawAgency.top_level_agency.agency_code === rawAgency.agency_code
    ) {
      return [...acc, agencyOption];
    }
    const parent = acc.find(
      (agency: FilterOption) =>
        agency.id === rawAgency.top_level_agency?.agency_code,
    );
    // parent should always exist because of the pre-sort, if it doesn't just skip the agency
    if (!parent) {
      console.error(
        `Parent agency not found: ${rawAgency.top_level_agency?.agency_code}`,
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

export const getAgenciesForFilterOptions = async (
  prefetchedOptions?: FilterOption[],
): Promise<FilterOption[]> => {
  try {
    if (prefetchedOptions) {
      return Promise.resolve(prefetchedOptions);
    }
    const agencies = await obtainAgencies();
    const filterOptions = agenciesToFilterOptions(agencies);
    return sortFilterOptions(filterOptions);
  } catch (e) {
    console.error("Error fetching agencies", e);
    return [];
  }
};
