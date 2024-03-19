"use client";

import {
  FilterOption,
  SearchFilterAccordion,
} from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

export interface SearchFilterFundingInstrumentProps {
  initialQueryParams: string;
  formRef: React.RefObject<HTMLFormElement>;
}

export default function SearchFilterFundingInstrument({
  formRef,
  initialQueryParams,
}: SearchFilterFundingInstrumentProps) {
  const initialFilterOptions: FilterOption[] = [
    {
      id: "funding-instrument-cooperative_agreement",
      label: "Cooperative Agreement",
      value: "cooperative_agreement",
    },
    {
      id: "funding-instrument-grant",
      label: "Grant",
      value: "grant",
    },
    {
      id: "funding-instrument-procurement_contract",
      label: "Procurement Contract ",
      value: "procurement_contract",
    },
    {
      id: "funding-instrument-other",
      label: "Other",
      value: "other",
    },
  ];

  return (
    <SearchFilterAccordion
      initialFilterOptions={initialFilterOptions}
      title="Funding instrument"
      queryParamKey="fundingInstrument"
      formRef={formRef}
      initialQueryParams={initialQueryParams}
    />
  );
}
