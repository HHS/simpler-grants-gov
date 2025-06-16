import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { QueryContext } from "src/services/search/QueryProvider";
import {
  FilterOption,
  FilterOptionWithChildren,
} from "src/types/search/searchFilterTypes";

import { useContext, useMemo } from "react";

import { AnyOptionCheckbox } from "src/components/search/SearchFilterAccordion/AnyOptionCheckbox";
import { SearchFilterAccordionProps } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";
import SearchFilterSection from "src/components/search/SearchFilterAccordion/SearchFilterSection/SearchFilterSection";

interface AgencyFilterBodyProps extends SearchFilterAccordionProps {
  referenceOptions?: FilterOption[];
  topLevelQuery?: Set<string>;
  topLevelQueryParamKey?: string;
  isParentSelected?: (value: string) => boolean;
}

// can rename to NestedCheckboxFilterBody if we can generalize a bit more
export function AgencyFilterBody({
  includeAnyOption,
  title,
  queryParamKey,
  defaultEmptySelection,
  filterOptions,
  query,
  facetCounts,
  referenceOptions,
  topLevelQuery,
  topLevelQueryParamKey,
  isParentSelected = () => false,
}: AgencyFilterBodyProps) {
  const { queryTerm } = useContext(QueryContext);
  const { updateQueryParams, setQueryParams } = useSearchParamUpdater();

  const toggleOptionChecked = (value: string, isChecked: boolean) => {
    const newParamValue = new Set(query);
    isChecked ? newParamValue.add(value) : newParamValue.delete(value);
    // handle status filter custom behavior to set param when all options are unselected
    const updatedParamValue =
      !newParamValue.size && defaultEmptySelection?.size
        ? defaultEmptySelection
        : newParamValue;
    // if removing a value, and topLevelValue is present, remove them both
    if (!isChecked && topLevelQuery && isParentSelected(value)) {
      topLevelQuery.delete(value.split("-")[0]);
      const paramsToUpdate = [
        [queryParamKey, Array.from(updatedParamValue).join(",")],
        [topLevelQueryParamKey, Array.from(topLevelQuery).join(",")],
      ];
      if (queryTerm) {
        paramsToUpdate.push(["query", queryTerm]);
      }
      return setQueryParams(paramsToUpdate);
    }
    updateQueryParams(updatedParamValue, queryParamKey, queryTerm);
  };

  const isNoneSelected = useMemo(() => query.size === 0, [query]);

  return (
    <div data-testid={`${title}-filter`}>
      <ul className="usa-list usa-list--unstyled">
        {includeAnyOption && (
          <li>
            <AnyOptionCheckbox
              title={title.toLowerCase()}
              checked={isNoneSelected}
              queryParamKey={queryParamKey}
              defaultEmptySelection={defaultEmptySelection}
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
                topLevelQueryParamKey={topLevelQueryParamKey}
                updateCheckedOption={toggleOptionChecked}
                accordionTitle={title}
                facetCounts={facetCounts}
                isParentSelected={isParentSelected}
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
