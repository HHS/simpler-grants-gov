import { FilterOption } from "src/types/search/searchFilterTypes";

import dynamic from "next/dynamic";

import TooltipWrapper from "src/components/TooltipWrapper";

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
  const OptionLabelText = <span>{option.label}</span>;
  return (
    <>
      {option.tooltip ? (
        <DynamicTooltipWrapper
          label={option.tooltip}
          title={option.label}
          className="usa-button--unstyled"
        >
          {OptionLabelText}
        </DynamicTooltipWrapper>
      ) : (
        OptionLabelText
      )}
      {!!facetCounts && (
        <span className="text-base-dark padding-left-05">
          [{facetCounts[option.value] || 0}]
        </span>
      )}
    </>
  );
}
