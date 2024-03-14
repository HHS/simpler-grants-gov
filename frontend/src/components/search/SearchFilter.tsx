import { Accordion, Checkbox, Icon } from "@trussworks/react-uswds";
import React, { useEffect, useState } from "react";

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
  children?: FilterOption[];
}

// export default function SearchFilter() {
export function SearchFilter(props: {
  filterOptions: FilterOption[];
  title: string;
}) {
  useEffect(() => {
    setMounted(true);
  }, []);

  const [mounted, setMounted] = useState<boolean>(false);

  const [checkedTotal, setCheckedTotal] = useState<number>(0);
  const incrementTotal = () => {
    setCheckedTotal(checkedTotal + 1);
  };
  const decrementTotal = () => {
    setCheckedTotal(checkedTotal - 1);
  };

  function FilterCheckbox(props: {
    option: FilterOption;
    increment: () => void;
    decrement: () => void;
  }) {
    const handleClick = (target: EventTarget) => {
      const checked = (target as HTMLInputElement).checked;
      return checked ? props.increment() : props.decrement();
    };

    return (
      <Checkbox
        id={props.option.id}
        name={props.option.id}
        label={props.option.label}
        onClick={(e) => handleClick(e.target)}
        disabled={!mounted} // Required to be disabled until hydrated so query params are updated properly
      />
    );
  }

  const FilterSection = (props: { option: FilterOption }) => {
    const [childrenVisible, setChildrenVisible] = useState<boolean>(false);

    // TODO: Set this number per state/query params
    const [sectionCount, setSectionCount] = useState<number>(0);
    const increment = () => {
      setSectionCount(sectionCount + 1);
      incrementTotal();
    };
    const decrement = () => {
      setSectionCount(sectionCount - 1);
      decrementTotal();
    };

    return (
      <div>
        <button
          className="usa-button usa-button--unstyled width-full border-bottom-2px border-base-lighter"
          onClick={(event) => {
            event.preventDefault();
            setChildrenVisible(!childrenVisible);
          }}
        >
          <span className="grid-row flex-align-center margin-left-neg-1">
            <span className="grid-col flex-fill">
              {childrenVisible ? (
                <Icon.ArrowDropUp size={5} className="text-middle" />
              ) : (
                <Icon.ArrowDropDown size={5} className="text-middle" />
              )}
              {props.option.id}
            </span>
            <span className="grid-col flex-auto">
              {!!sectionCount && (
                <span className="usa-tag usa-tag--big radius-pill margin-left-1">
                  {sectionCount}
                </span>
              )}
            </span>
          </span>
        </button>
        {childrenVisible && (
          <div className="padding-y-1">
            <div className="grid-row">
              <div className="grid-col-fill">
                <button className="usa-button usa-button--unstyled font-sans-xs">
                  Select All
                </button>
              </div>
              <div className="grid-col-fill text-right">
                <button className="usa-button usa-button--unstyled font-sans-xs">
                  Clear All
                </button>
              </div>
            </div>

            <ul className="usa-list usa-list--unstyled margin-left-4">
              {props.option.children?.map((child) => (
                <li key={child.id}>
                  <FilterCheckbox
                    option={child}
                    increment={increment}
                    decrement={decrement}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const accordionOptions: AccordionItemProps[] = [
    {
      title: (
        <>
          {props.title}
          {!!checkedTotal && (
            <span className="usa-tag usa-tag--big radius-pill margin-left-1">
              {checkedTotal}
            </span>
          )}
        </>
      ),
      content: (
        <>
          <div className="grid-row">
            <div className="grid-col-fill">
              <button className="usa-button usa-button--unstyled font-sans-xs">
                Select All
              </button>
            </div>
            <div className="grid-col-fill text-right">
              <button className="usa-button usa-button--unstyled font-sans-xs">
                Clear All
              </button>
            </div>
          </div>

          <ul className="usa-list usa-list--unstyled">
            {props.filterOptions.map((option) => (
              <li key={option.id}>
                {option.children ? (
                  <FilterSection option={option} />
                ) : (
                  <FilterCheckbox
                    option={option}
                    increment={incrementTotal}
                    decrement={decrementTotal}
                  />
                )}
              </li>
            ))}
          </ul>
        </>
      ),
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

export default SearchFilter;
