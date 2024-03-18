import { Accordion } from "@trussworks/react-uswds";
import { QueryParamKey } from "../../../types/searchTypes";
import SearchFilterCheckbox from "./SearchFilterCheckbox";
import SearchFilterSection from "./SearchFilterSection/SearchFilterSection";
import SearchFilterToggleAll from "./SearchFilterToggleAll";
import useSearchFilter from "../../../hooks/useSearchFilterAccordion";

export interface AccordionItemProps {
  title: React.ReactNode | string;
  content: React.ReactNode;
  expanded: boolean;
  id: string;
  headingLevel: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
  // handleToggle?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  isChecked?: boolean;
  children?: FilterOption[];
}

interface SearchFilterAccordionProps {
  initialFilterOptions: FilterOption[];
  title: string; // Title in header of accordion
  initialQueryParams: string; // comma-separated string list of query params from the request URL
  queryParamKey: QueryParamKey; // Ex - In query params, search?{key}=first,second,third
  formRef: React.RefObject<HTMLFormElement>;
}

export function SearchFilterAccordion({
  initialFilterOptions,
  title,
  queryParamKey,
  initialQueryParams,
  formRef,
}: SearchFilterAccordionProps) {
  // manage most of state in custom hook
  const {
    // totalCheckedCount,
    options,
    mounted,
    toggleOptionChecked,
    toggleSelectAll,
    incrementTotal,
    decrementTotal,
    isAllSelected,
    isNoneSelected,
    isSectionAllSelected,
    isSectionNoneSelected,
    totalChecked,
  } = useSearchFilter(
    initialFilterOptions,
    initialQueryParams,
    queryParamKey,
    formRef,
  );

  const getAccordionTitle = () => (
    <>
      {title}
      {!!totalChecked && (
        <span className="usa-tag usa-tag--big radius-pill margin-left-1">
          {totalChecked}
        </span>
      )}
      {/* {!!totalCheckedCount && (
        <span className="usa-tag usa-tag--big radius-pill margin-left-1">
          {totalCheckedCount}
        </span>
      )} */}
    </>
  );

  const getAccordionContent = () => (
    <>
      <SearchFilterToggleAll
        onSelectAll={() => toggleSelectAll(true)}
        onClearAll={() => toggleSelectAll(false)}
        isAllSelected={isAllSelected}
        isNoneSelected={isNoneSelected}
      />
      <ul className="usa-list usa-list--unstyled">
        {options.map((option) => (
          <li key={option.id}>
            {/* If we have children, show a "section" dropdown, otherwise show just a checkbox */}
            {option.children ? (
              // SearchFilterSection will map over all children of this option
              <SearchFilterSection
                option={option}
                incrementTotal={incrementTotal}
                decrementTotal={decrementTotal}
                mounted={mounted}
                updateCheckedOption={toggleOptionChecked}
                toggleSelectAll={toggleSelectAll}
                isSectionAllSelected={isSectionAllSelected[option.id]}
                isSectionNoneSelected={isSectionNoneSelected[option.id]}
              />
            ) : (
              <SearchFilterCheckbox
                option={option}
                increment={incrementTotal}
                decrement={decrementTotal}
                mounted={mounted}
                updateCheckedOption={toggleOptionChecked}
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );

  const accordionOptions: AccordionItemProps[] = [
    {
      title: getAccordionTitle(),
      content: getAccordionContent(),
      expanded: false,
      id: "funding-instrument-filter",
      headingLevel: "h4",
    },
  ];

  return (
    <Accordion
      bordered={true}
      items={accordionOptions}
      multiselectable={true}
      className="margin-top-4"
    />
  );
}

export default SearchFilterAccordion;
