"use client";

import { SearchFilterAccordion } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import { agencyFilterList } from "./SearchFilterAccordion/filterJSONLists/agencyFilterList";

export interface SearchFilterAgencyProps {
  initialQueryParams: Set<string>;
  formRef: React.RefObject<HTMLFormElement>;
}

export default function SearchFilterAgency({
  initialQueryParams,
  formRef,
}: SearchFilterAgencyProps) {
  return (
    <SearchFilterAccordion
      initialFilterOptions={agencyFilterList}
      title="Agency"
      queryParamKey="agency"
      initialQueryParams={initialQueryParams}
      formRef={formRef}
    />
  );
}
