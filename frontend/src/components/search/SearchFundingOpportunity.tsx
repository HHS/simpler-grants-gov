import { Accordion, Checkbox } from "@trussworks/react-uswds";
import React from "react";

interface AccordionItemProps {
  title: React.ReactNode | string;
  content: React.ReactNode;
  expanded: boolean;
  id: string;
  headingLevel: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
  // handleToggle?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export default function SearchFundingOpportunity() {
  const filterOptions: FilterOption[] = [
    {
      id: "funding-opportunity-cooperative_agreement",
      label: "Cooperative Agreement",
      value: "cooperative_agreement",
    },
    { id: "funding-opportunity-grant", label: "Grant", value: "grant" },
    {
      id: "funding-opportunity-procurement_contract",
      label: "Procurement Contract ",
      value: "procurement_contract",
    },
    { id: "funding-opportunity-other", label: "Other", value: "other" },
  ];

  const accordionOptions: AccordionItemProps[] = [
    {
      title: "Funding instrument type",
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

          {filterOptions.map((option) => (
            <div key={option.id} className="">
              <Checkbox
                id={option.id}
                name={option.id}
                label={option.label}
                // onChange={(e) => handleCheck(option.value, e.target.checked)}
                // disabled={!mounted} // Required to be disabled until hydrated so query params are updated properly
              />
            </div>
          ))}
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
