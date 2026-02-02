import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { QueryContext } from "src/services/search/QueryProvider";
import {
  FilterOption,
  FilterOptionWithChildren,
} from "src/types/search/searchFilterTypes";
import { ValidSearchQueryParamData } from "src/types/search/searchQueryTypes";
import {
  getAgencyParent,
  getSiblingOptionValues,
} from "src/utils/search/searchUtils";

import { useCallback, useContext, useMemo } from "react";

import { AnyOptionCheckbox } from "src/components/search/SearchFilterAccordion/AnyOptionCheckbox";
import { SearchAccordionContentProps } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";
import SearchFilterSection from "src/components/search/SearchFilterAccordion/SearchFilterSection";

interface AgencyFilterBodyProps extends SearchAccordionContentProps {
  referenceOptions?: FilterOption[];
  topLevelQuery?: Set<string>;
}

// can rename to NestedCheckboxFilterBody if we can generalize a bit more
export function AgencyFilterBody({
  includeAnyOption,
  title,
  filterOptions,
  query,
  facetCounts,
  referenceOptions,
  topLevelQuery,
}: AgencyFilterBodyProps) {
  const { queryTerm } = useContext(QueryContext);
  const { updateQueryParams, setQueryParams } = useSearchParamUpdater();

  const isParentAgencySelected = useCallback(
    (subAgencyCode: string): boolean => {
      return topLevelQuery?.has(getAgencyParent(subAgencyCode)) || false;
    },
    [topLevelQuery],
  );

  const toggleOptionChecked = (value: string, isChecked: boolean) => {
    const newParamValue = new Set(query);
    isChecked ? newParamValue.add(value) : newParamValue.delete(value);
    // happy path a normal checkbox experience
    if (isChecked || !topLevelQuery || !isParentAgencySelected(value)) {
      return updateQueryParams(newParamValue, "agency", queryTerm);
    }
    // handle unchecking a child box when top level parent is selected
    // need to add children of selected top level, minus the one that has just been removed
    // since they previously were not present anywhere in the url, but should remain selected
    const siblingOptions = getSiblingOptionValues(value, filterOptions);
    // remove top level agency
    topLevelQuery.delete(getAgencyParent(value));
    const paramsToUpdate = {
      agency: Array.from(newParamValue).concat(siblingOptions).join(","),
      topLevelAgency: Array.from(topLevelQuery).join(","),
    } as ValidSearchQueryParamData;
    if (queryTerm) {
      paramsToUpdate.query = queryTerm;
    }
    return setQueryParams(paramsToUpdate);
  };

  const isNoneSelected = useMemo(
    () => !query.size && !topLevelQuery?.size,
    [query, topLevelQuery],
  );

  return (
    <div data-testid={`${title}-filter`}>
      <ul className="usa-list usa-list--unstyled">
        {includeAnyOption && (
          <li className="margin-y-2">
            <AnyOptionCheckbox
              title={title.toLowerCase()}
              checked={isNoneSelected}
              queryParamKey="agency"
              topLevelQueryParamKey="topLevelAgency"
            />
          </li>
        )}
        {filterOptions.map((option) => (
          <li key={option.id}>
            {/* If we have children, show a "section", otherwise show just a checkbox */}
            {option.children ? (
              // SearchFilterSection will map over all children of this option
              <SearchFilterSection
                option={option as FilterOptionWithChildren}
                referenceOption={
                  referenceOptions &&
                  (referenceOptions.find(
                    (referenceOption) => referenceOption.id === option.id,
                  ) as FilterOptionWithChildren)
                }
                query={query}
                topLevelQuery={topLevelQuery}
                topLevelQueryParamKey="topLevelAgency"
                queryParamKey="agency"
                updateCheckedOption={toggleOptionChecked}
                accordionTitle={title}
                facetCounts={facetCounts}
                isParentSelected={isParentAgencySelected}
              />
            ) : (
              <SearchFilterCheckbox
                option={option}
                query={query}
                updateCheckedOption={toggleOptionChecked}
                accordionTitle={title}
                facetCounts={facetCounts}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
