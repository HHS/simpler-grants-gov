import {
  FilterOption,
  SearchFilterAccordion,
} from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

export default function SearchFilterFundingInstrument() {
  const initialFilterOptions: FilterOption[] = [
    {
      id: "funding-opportunity-cooperative_agreement",
      label: "Cooperative Agreement",
      value: "cooperative_agreement",
    },
    {
      id: "funding-opportunity-grant",
      label: "Grant",
      value: "grant",
    },
    {
      id: "funding-opportunity-procurement_contract",
      label: "Procurement Contract ",
      value: "procurement_contract",
    },
    {
      id: "funding-opportunity-other",
      label: "Other",
      value: "other",
    },
  ];

  return (
    <SearchFilterAccordion
      initialFilterOptions={initialFilterOptions}
      title="Funding instrument"
    />
  );
}
