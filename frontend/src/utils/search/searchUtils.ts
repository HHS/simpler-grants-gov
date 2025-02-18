import { Opportunity } from "src/types/search/searchResponseTypes";

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
// THIS NEEDS TO SUPPORT THE NEW LOGIC

/*
                {opportunity?.top_level_agency_name &&
                opportunity?.agency_name &&
                opportunity?.top_level_agency_name !== opportunity?.agency_name
                  ? `${opportunity?.top_level_agency_name} - ${opportunity?.agency_name}`
                  : opportunity?.agency_name ||
                    (agencyNameLookup && opportunity?.summary?.agency_code
                      ? // Use same exact label we're using for the agency filter list
                        agencyNameLookup[opportunity?.summary?.agency_code]
                      : "--")}
*/
export const getAgencyDisplayName = (opportunity: Opportunity): string => {
  if (
    opportunity.top_level_agency_name &&
    opportunity.agency_name &&
    opportunity.top_level_agency_name !== opportunity.agency_name
  ) {
    return `${opportunity.top_level_agency_name} - ${opportunity.agency_name}`;
  }

  return opportunity.agency_name || opportunity.agency_code || "--";
};
