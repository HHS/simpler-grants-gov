import { FilterOption } from "../../components/search/SearchFilterAccordion/SearchFilterAccordion";
import { QueryParamKey } from "../../types/searchTypes";

type UpdateQueryParamsFunction = (
  checkedSet: Set<string>,
  queryParamKey: QueryParamKey,
) => void;

export default class SearchFilterManager {
  options: FilterOption[];
  setOptions: React.Dispatch<React.SetStateAction<FilterOption[]>>;
  updateQueryParams: UpdateQueryParamsFunction;
  formRef: React.RefObject<HTMLFormElement>;

  constructor(
    options: FilterOption[],
    setOptions: React.Dispatch<React.SetStateAction<FilterOption[]>>,
    updateQueryParams: UpdateQueryParamsFunction,
    formRef: React.RefObject<HTMLFormElement>,
  ) {
    this.options = options;
    this.setOptions = setOptions;
    this.updateQueryParams = updateQueryParams;
    this.formRef = formRef;
  }

  static initializeOptions = (
    initialFilterOptions: FilterOption[],
    initialQueryParams: string | null,
  ) => {
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
  };

  // Method to count checked options
  countChecked = (options: FilterOption[]): number => {
    return options.reduce(
      (acc, option) =>
        acc +
        (option.isChecked ? 1 : 0) +
        (option.children ? this.countChecked(option.children) : 0),
      0,
    );
  };

  // Check if all options in a section are selected
  isSectionAllSelected = (
    options: FilterOption[],
    sectionId: string,
  ): boolean => {
    const section = options.find((option) => option.id === sectionId);
    if (!section || !section.children) return false;
    return section.children.every((child) => child.isChecked);
  };

  // Get checked count by section
  getCheckedCountBySection = (
    options: FilterOption[],
  ): Record<string, number> => {
    return options.reduce(
      (acc, option) => {
        if (option.children) {
          acc[option.id] = this.countChecked(option.children);
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  };

  // Check if all options in the whole accordion are selected
  isAllSelected = (options: FilterOption[]): boolean => {
    return options.every(
      (option) =>
        option.isChecked ||
        (option.children && this.isAllSelected(option.children)),
    );
  };
}
