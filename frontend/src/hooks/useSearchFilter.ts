import { useCallback, useEffect, useState } from "react";

import { FilterOption } from "../components/search/SearchFilterAccordion/SearchFilterAccordion";

function useSearchFilter(initialFilterOptions: FilterOption[]) {
  // Initialize all isChecked to false
  const [options, setOptions] = useState<FilterOption[]>(
    initialFilterOptions.map((option) => ({
      ...option,
      isChecked: false,
      children: option.children
        ? option.children.map((child) => ({
            ...child,
            isChecked: false,
          }))
        : undefined,
    })),
  );

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

  // Toggle all options or options within a section
  const toggleSelectAll = useCallback(
    (isSelected: boolean, sectionId?: string) => {
      setOptions((currentOptions) => {
        const newOptions = recursiveToggle(
          currentOptions,
          isSelected,
          sectionId,
        );
        return newOptions;
      });
    },
    [recursiveToggle],
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
        return updateChecked(prevOptions);
      });
    },
    [],
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
