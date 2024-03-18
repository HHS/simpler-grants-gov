"use client";

import { useCallback, useEffect, useState } from "react";

import { FilterOption } from "../components/search/SearchFilterAccordion/SearchFilterAccordion";
import { QueryParamKey } from "../types/searchTypes";
import { useDebouncedCallback } from "use-debounce";
import { useSearchParamUpdater } from "./useSearchParamUpdater";

// Encapsulate core search filter accordion logic:
// - Keep track of checked count
//     - Provide increment/decrement functions
// - Toggle one or all checkboxes
// - Run debounced function that updates query params and submits form
// (Does not cover opportunity status checkbox logic)
function useSearchFilter(
  initialFilterOptions: FilterOption[],
  initialQueryParams: string,
  queryParamKey: QueryParamKey, // agency, fundingInstrument, eligibility, or category
  formRef: React.RefObject<HTMLFormElement>,
) {
  const { updateQueryParams } = useSearchParamUpdater();
  const [options, setOptions] = useState<FilterOption[]>(() =>
    initializeOptions(initialFilterOptions, initialQueryParams),
  );

  function initializeOptions(
    initialFilterOptions: FilterOption[],
    initialQueryParams: string | null,
  ) {
    // convert the request URL query params to a set
    const initialParamsSet = new Set(
      initialQueryParams ? initialQueryParams.split(",") : [],
    );
    return initialFilterOptions.map((option) => ({
      ...option,
      isChecked: initialParamsSet.has(option.value),
      children: option.children
        ? option.children.map((child) => ({
            ...child,
            isChecked: initialParamsSet.has(child.value),
          }))
        : undefined,
    }));
  }

  // Recursively count checked options
  const countChecked = useCallback((optionsList: FilterOption[]): number => {
    return optionsList.reduce((acc, option) => {
      return option.children
        ? acc + countChecked(option.children)
        : acc + (option.isChecked ? 1 : 0);
    }, 0);
  }, []);

  // Used for disabled select all / clear all states
  const determineInitialSelectionStates = useCallback(
    (options: FilterOption[]) => {
      const totalOptions = options.reduce((total, option) => {
        return total + (option.children ? option.children.length : 1);
      }, 0);

      const totalChecked = countChecked(options);
      const allSelected = totalChecked === totalOptions;
      const noneSelected = totalChecked === 0;

      type SectionStates = {
        isSectionAllSelected: { [key: string]: boolean };
        isSectionNoneSelected: { [key: string]: boolean };
      };

      const sectionStates = options.reduce<SectionStates>(
        (acc, option) => {
          if (option.children) {
            const totalInSection = option.children.length;
            const checkedInSection = countChecked(option.children);
            acc.isSectionAllSelected[option.id] =
              totalInSection === checkedInSection;
            acc.isSectionNoneSelected[option.id] = checkedInSection === 0;
          }
          return acc;
        },
        { isSectionAllSelected: {}, isSectionNoneSelected: {} },
      );

      return {
        allSelected,
        noneSelected,
        ...sectionStates,
      };
    },
    [countChecked],
  );

  const initialSelectionStates = determineInitialSelectionStates(options);

  const [isAllSelected, setIsAllSelected] = useState<boolean>(
    initialSelectionStates.allSelected,
  );
  const [isNoneSelected, setIsNoneSelected] = useState<boolean>(
    initialSelectionStates.noneSelected,
  );
  const [isSectionAllSelected, setIsSectionAllSelected] = useState<{
    [key: string]: boolean;
  }>(initialSelectionStates.isSectionAllSelected);
  const [isSectionNoneSelected, setIsSectionNoneSelected] = useState<{
    [key: string]: boolean;
  }>(initialSelectionStates.isSectionNoneSelected);

  const [checkedTotal, setCheckedTotal] = useState<number>(0);
  const incrementTotal = () => {
    setCheckedTotal(checkedTotal + 1);
  };
  const decrementTotal = () => {
    setCheckedTotal(checkedTotal - 1);
  };

  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
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

  // Extracted function to calculate and update selection states
  const updateSelectionStates = useCallback(
    (newOptions: FilterOption[], sectionId?: string | undefined) => {
      const newSelectionStates = determineInitialSelectionStates(newOptions);
      setIsAllSelected(newSelectionStates.allSelected);
      setIsNoneSelected(newSelectionStates.noneSelected);

      if (sectionId) {
        setIsSectionAllSelected((prevState) => ({
          ...prevState,
          [sectionId]: newSelectionStates.isSectionAllSelected[sectionId],
        }));
        setIsSectionNoneSelected((prevState) => ({
          ...prevState,
          [sectionId]: newSelectionStates.isSectionNoneSelected[sectionId],
        }));
      } else {
        setIsSectionAllSelected(newSelectionStates.isSectionAllSelected);
        setIsSectionNoneSelected(newSelectionStates.isSectionNoneSelected);
      }
    },
    [determineInitialSelectionStates],
  );

  // Toggle all checkbox options on the accordion, or all within a section
  const toggleSelectAll = useCallback(
    (isSelected: boolean, sectionId?: string) => {
      setOptions((currentOptions) => {
        const newOptions = recursiveToggle(
          currentOptions,
          isSelected,
          sectionId,
        );

        updateSelectionStates(newOptions, sectionId);

        debouncedUpdateQueryParams();
        return newOptions;
      });
    },
    [recursiveToggle, debouncedUpdateQueryParams, updateSelectionStates],
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
        const newOptions = updateChecked(prevOptions);
        updateSelectionStates(newOptions);

        // If the option being toggled has children, pass the option's id to update its specific section state
        if (prevOptions.find((opt) => opt.id === optionId)?.children) {
          updateSelectionStates(newOptions, optionId);
        }

        // Trigger the debounced update when options/checkboxes change
        debouncedUpdateQueryParams();
        return newOptions;
      });
    },
    [debouncedUpdateQueryParams, updateSelectionStates],
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
    isAllSelected,
    isNoneSelected,
    isSectionAllSelected,
    isSectionNoneSelected,
  };
}

export default useSearchFilter;
