import clsx from "clsx";
import { FilterOption } from "src/types/search/searchFilterTypes";

import dynamic from "next/dynamic";

const DynamicTooltipWrapper = dynamic(
  () => import("src/components/TooltipWrapper"),
  {
    ssr: false, // works around bug with Trussworks assigning different random ids on server and client renders
  },
);

export function FilterOptionLabel({
  option,
  facetCounts,
}: {
  option: FilterOption;
  facetCounts?: { [key: string]: number };
}) {
  const OptionLabelText = (
    <>
      <span>{option.label}</span>
      {!!facetCounts && (
        <span
          className={clsx("text-base-dark", {
            "padding-left-05": !option.tooltip,
          })}
        >
          [{facetCounts[option.value] || 0}]
        </span>
      )}
    </>
  );
  return option.tooltip ? (
    <DynamicTooltipWrapper
      label={<div className="text-wrap">{option.tooltip}</div>}
      title={option.label}
      className="usa-button--unstyled"
      wrapperclasses="simpler-wrap-tooltip"
    >
      {OptionLabelText}
    </DynamicTooltipWrapper>
  ) : (
    OptionLabelText
  );
}
