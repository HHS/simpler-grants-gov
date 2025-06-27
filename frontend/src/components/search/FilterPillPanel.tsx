import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import { QueryParamData } from "src/types/search/searchRequestTypes";
import {
  agenciesToSortedFilterOptions,
  formatPillLabels,
} from "src/utils/search/filterUtils";

import { PillList } from "./PillList";

export async function FilterPillPanel({
  searchParams,
  agencyListPromise,
}: {
  searchParams: QueryParamData;
  agencyListPromise: Promise<RelevantAgencyRecord[]>;
}) {
  let agencies;
  try {
    agencies = await agencyListPromise; // TODO: this needs to be a flat list. Do we have that available?
  } catch (e) {
    console.error("Unable to fetch agency options for pills");
  }
  const agencyOptions = agenciesToSortedFilterOptions(agencies || []);
  const pillLabelData = formatPillLabels(searchParams, agencyOptions || []);
  return (
    <div>
      <PillList pills={pillLabelData} />
    </div>
  );
}
