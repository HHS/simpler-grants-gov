"use client";

import { useCallback, useEffect, useState } from "react";

import { FilterOption } from "../components/search/SearchFilterAccordion/SearchFilterAccordion";
import { QueryParamKey } from "../types/search/searchResponseTypes";
import { useDebouncedCallback } from "use-debounce";
import { useSearchParamUpdater } from "./useSearchParamUpdater";

// Encapsulate core search filter accordion logic:
// - Keep track of checked count
//     - Increment/decrement functions
// - Toggle one or all checkboxes
// - Run debounced function that updates query params and submits form
// (Does not cover opportunity status checkbox logic)
function useSearchFilter(
  initialFilterOptions: FilterOption[],
  initialQueryParams: Set<string>,
  queryParamKey: QueryParamKey, // agency, fundingInstrument, eligibility, or category
  formRef: React.RefObject<HTMLFormElement>,
) {
  const [options, setOptions] = useState<FilterOption[]>(() =>
    initializeOptions(initialFilterOptions, initialQueryParams),
  );

  function initializeOptions(
    initialFilterOptions: FilterOption[],
    initialQueryParams: Set<string>,
  ) {
    return initialFilterOptions.map((option) => ({
      ...option,
      isChecked: initialQueryParams.has(option.value),
      children: option.children
        ? option.children.map((child) => ({
            ...child,
            isChecked: initialQueryParams.has(child.value),
          }))
        : undefined,
    }));
  }

  const [checkedTotal, setCheckedTotal] = useState<number>(0);
  const incrementTotal = () => {
    setCheckedTotal(checkedTotal + 1);
  };
  const decrementTotal = () => {
    setCheckedTotal(checkedTotal - 1);
  };

  const { updateQueryParams } = useSearchParamUpdater();

  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Recursively count checked options
  const countChecked = useCallback((optionsList: FilterOption[]): number => {
    return optionsList.reduce((acc, option) => {
      return option.children
        ? acc + countChecked(option.children)
        : acc + (option.isChecked ? 1 : 0);
    }, 0);
  }, []);

  // Recursively toggle options
  const recursiveToggle = useCallback(
    (
      optionsList: FilterOption[],
      isSelected: boolean,
      sectionId?: string,
      withinSection = false,
    ): FilterOption[] => {
      return optionsList.map((option) => {
        const isInSection = sectionId
          ? option.id === sectionId || withinSection
          : true;
        return {
          ...option,
          isChecked: isInSection ? isSelected : option.isChecked,
          children: option.children
            ? recursiveToggle(
                option.children,
                isSelected,
                sectionId,
                isInSection,
              )
            : undefined,
        };
      });
    },
    [],
  );

  // Update query params and submit form to refresh search results
  const debouncedUpdateQueryParams = useDebouncedCallback(() => {
    const checkedSet = new Set<string>();

    const checkOption = (option: FilterOption) => {
      if (option.isChecked) {
        checkedSet.add(option.value);
      }
      if (option.children) {
        // recursively add children checked options to the set
        option.children.forEach(checkOption);
      }
    };

    // Build a new set of the checked options.
    // TODO: instead of building the Set from scratch everytime
    // a Set could be maintaned on click/select all.
    options.forEach(checkOption);

    updateQueryParams(checkedSet, queryParamKey);
    formRef.current?.requestSubmit();
  }, 500);

  // Toggle all checkbox options on the accordion, or all within a section
  const toggleSelectAll = useCallback(
    (isSelected: boolean, sectionId?: string) => {
      setOptions((currentOptions) => {
        const newOptions = recursiveToggle(
          currentOptions,
          isSelected,
          sectionId,
        );

        debouncedUpdateQueryParams();
        return newOptions;
      });
    },
    [recursiveToggle, debouncedUpdateQueryParams],
  );

  // Toggle a single option
  const toggleOptionChecked = useCallback(
    (optionId: string, isChecked: boolean) => {
      setOptions((prevOptions) => {
        const updateChecked = (options: FilterOption[]): FilterOption[] => {
          return options.map((opt) => ({
            ...opt,
            isChecked: opt.id === optionId ? isChecked : opt.isChecked,
            children: opt.children ? updateChecked(opt.children) : undefined,
          }));
        };

        // Trigger the debounced update when options/checkboxes change
        debouncedUpdateQueryParams();
        return updateChecked(prevOptions);
      });
    },
    [debouncedUpdateQueryParams],
  );

  // The total count of checked options
  const totalCheckedCount = countChecked(options);

  return {
    mounted,
    options,
    setOptions,
    toggleSelectAll,
    toggleOptionChecked,
    totalCheckedCount,
    incrementTotal,
    decrementTotal,
  };
}

export default useSearchFilter;
