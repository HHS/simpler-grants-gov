import { QueryParamData } from "src/types/search/searchRequestTypes";

import { Pill } from "../Pill";

export function FilterPillPanel({
  searchParams,
}: {
  searchParams: QueryParamData;
}) {
  const pillLabelData = formatPillLabels(searchParams);
  return (
    <div>
      {pillLabelData?.length &&
        pillLabelData.map(({ queryParamKey, queryParamValue, label }) => (
          <Pill
            label={label}
            onClose={() =>
              console.log("!!! close", queryParamKey, queryParamValue)
            }
          />
        ))}
    </div>
  );
}
