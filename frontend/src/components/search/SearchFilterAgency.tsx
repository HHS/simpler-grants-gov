import { SearchFilterAccordion } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import { agencyFilterList } from "./SearchFilterAccordion/filterJSONLists/agencyFilterList";

export default function SearchFilterAgency() {
  return (
    <SearchFilterAccordion
      initialFilterOptions={agencyFilterList}
      title="Agency"
    />
  );
}
