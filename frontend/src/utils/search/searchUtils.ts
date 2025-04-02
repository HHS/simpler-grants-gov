import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

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
