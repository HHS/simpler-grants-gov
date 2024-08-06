import { FilterOption } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import { Icon } from "@trussworks/react-uswds";

export default function SectionLinkLabel({
  childrenVisible,
  option,
}: {
  childrenVisible: boolean;
  option: FilterOption;
}) {
  // When the arrow is down, the section is collapsed, and we can expand the section
  // When the arrow is up, the section is expanded, and we can collapse the section
  const ariaLabel = childrenVisible ? "Collapse section" : "Expand section";

  return (
    <span className="grid-col flex-fill">
      {childrenVisible ? (
        <Icon.ArrowDropUp
          size={5}
          className="text-middle"
          aria-label={ariaLabel}
        />
      ) : (
        <Icon.ArrowDropDown
          size={5}
          className="text-middle"
          aria-label={ariaLabel}
        />
      )}
      {option.label}{" "}
      {/* Assuming you want to display the option's label instead of its ID */}
    </span>
  );
}
