"use client";

import clsx from "clsx";
import { FilterOption } from "src/types/search/searchFilterTypes";
import { ValidSearchQueryParam } from "src/types/search/searchQueryTypes";

import { Accordion } from "@trussworks/react-uswds";

export interface AccordionItemProps {
  title: React.ReactNode | string;
  content: React.ReactNode;
  expanded: boolean;
  id: string;
  headingLevel: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
}

export interface CommonSearchFilterAccordionProps {
  query: Set<string>;
  queryParamKey: ValidSearchQueryParam; // Ex - In query params, search?{key}=first,second,third
  title: string; // Title in header of accordion
}

export interface BasicSearchFilterAccordionProps extends CommonSearchFilterAccordionProps {
  className?: string;
  contentClassName?: string;
  expanded?: boolean;
  children: React.ReactNode;
}

export interface SearchAccordionContentProps extends CommonSearchFilterAccordionProps {
  filterOptions: FilterOption[];
  facetCounts?: { [key: string]: number };
  defaultEmptySelection?: Set<string>;
  includeAnyOption?: boolean;
}

export interface SearchFilterProps extends SearchAccordionContentProps {
  contentClassName?: string;
}

// new implementation, flexible to take whatever content it gets fed, not just checkboxes
export function BasicSearchFilterAccordion({
  children,
  title,
  queryParamKey,
  query,
  className,
  contentClassName,
  expanded = false,
}: BasicSearchFilterAccordionProps) {
  const accordionOptions: AccordionItemProps[] = [
    {
      title,
      content: children,
      expanded,
      id: `opportunity-filter-${queryParamKey as string}`,
      headingLevel: "h2",
      className: clsx(contentClassName, {
        "simpler-selected-filter": query.size,
      }),
    },
  ];

  return (
    <Accordion
      bordered={true}
      items={accordionOptions}
      multiselectable={true}
      className={clsx("margin-top-3", className)}
    />
  );
}
