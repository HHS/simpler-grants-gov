import { useCallback, useEffect, useState } from "react";

import { FilterOption } from "../components/search/SearchFilterAccordion/SearchFilterAccordion";

function useSearchFilter(initialOptions: FilterOption[]) {
  // Initialize all isChecked to false
  const [options, setOptions] = useState<FilterOption[]>(
    initialOptions.map((option) => ({
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
  };
}

export default useSearchFilter;
