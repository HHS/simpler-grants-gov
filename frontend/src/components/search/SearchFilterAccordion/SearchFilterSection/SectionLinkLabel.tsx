import { FilterOption } from "../SearchFilterAccordion";
import { Icon } from "@trussworks/react-uswds";

export default function SectionLinkLabel({
  childrenVisible,
  option,
}: {
  childrenVisible: boolean;
  option: FilterOption;
}) {
  return (
    <span className="grid-col flex-fill">
      {childrenVisible ? (
        <Icon.ArrowDropUp size={5} className="text-middle" />
      ) : (
        <Icon.ArrowDropDown size={5} className="text-middle" />
      )}
      {option.label}{" "}
      {/* Assuming you want to display the option's label instead of its ID */}
    </span>
  );
}
