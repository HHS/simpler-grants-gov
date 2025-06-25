import { FilterOption } from "src/types/search/searchFilterTypes";
import { QueryParamData } from "src/types/search/searchRequestTypes";
import { formatPillLabels } from "src/utils/search/searchUtils";

import { PillList } from "./PillList";

export async function FilterPillPanel({
  searchParams,
  agencyListPromise,
}: {
  searchParams: QueryParamData;
  agencyListPromise: Promise<FilterOption[]>;
}) {
  let agencyOptions;
  try {
    agencyOptions = await agencyListPromise; // TODO: this needs to be a flat list. Do we have that available?
  } catch (e) {
    console.error("Unable to fetch agency options for pills");
  }
  const pillLabelData = formatPillLabels(searchParams, agencyOptions || []);
  return (
    <div>
      <PillList pills={pillLabelData} />
    </div>
  );
}
