import { agencyFilterList } from "src/components/search/SearchFilterAccordion/filterJSONLists/agencyFilterList";

export interface AgencyFilterLookup {
  [key: string]: string;
}

export const generateAgencyFilterLookup = () => {
  const valueLabelMap: AgencyFilterLookup = {};

  agencyFilterList.forEach((agency) => {
    if (agency.children) {
      agency.children.forEach((child) => {
        valueLabelMap[child.value] = child.label;
      });
    } else {
      valueLabelMap[agency.value] = agency.label;
    }
  });

  return valueLabelMap;
};
