import { agencyFilterList } from "src/components/search/SearchFilterAccordion/filterJSONLists/agencyFilterList";

export interface AgencyNamyLookup {
  [key: string]: string;
}

export const generateAgencyNameLookup = () => {
  const agencyNameLookup: AgencyNamyLookup = {};

  agencyFilterList.forEach((agency) => {
    if (agency.children) {
      agency.children.forEach((child) => {
        agencyNameLookup[child.value] = child.label;
      });
    } else {
      agencyNameLookup[agency.value] = agency.label;
    }
  });

  return agencyNameLookup;
};
