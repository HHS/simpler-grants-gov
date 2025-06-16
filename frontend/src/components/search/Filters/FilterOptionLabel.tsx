import clsx from "clsx";
import { FilterOption } from "src/types/search/searchFilterTypes";

import InfoTooltip from "src/components/InfoTooltip";

export function FilterOptionLabel({
  option,
  facetCounts,
}: {
  option: FilterOption;
  facetCounts?: { [key: string]: number };
}) {
  return (
    <>
      <span>{option.label}</span>
      {!!facetCounts && (
        <span
          className={clsx("text-base-dark", {
            "padding-left-05": true,
          })}
        >
          [{facetCounts[option.value] || 0}]
        </span>
      )}
      {!!option.tooltip && (
        <InfoTooltip
          text={<div className="text-wrap minw-15">{option.tooltip}</div>}
          title={option.label}
          position="top"
          wrapperClasses="margin-left-1 simpler-tooltip" // if we go with this custom implementation we can remove the `minw-15` above
        />
      )}
    </>
  );
}
