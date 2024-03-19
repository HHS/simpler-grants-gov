import { FilterOption } from "../../components/search/SearchFilterAccordion/SearchFilterAccordion";
import { QueryParamKey } from "../../types/searchTypes";

type UpdateQueryParamsFunction = (
  checkedSet: Set<string>,
  queryParamKey: QueryParamKey,
) => void;

// TODO (Issue #1491): explore setting up a more maintanable class to manage checked state
// (This file is not currently being used though - just a placeholder for the meantime)
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
}
