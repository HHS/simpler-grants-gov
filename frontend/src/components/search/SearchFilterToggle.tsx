import { Dispatch, SetStateAction } from "react";

import { USWDSIcon } from "../USWDSIcon";

export default function SearchFilterToggle({
  setShowFilterOptions,
  showFilterOptions,
  buttonText,
}: {
  setShowFilterOptions: Dispatch<SetStateAction<boolean>>;
  showFilterOptions: boolean;
  buttonText: string;
}) {
  const iconName = showFilterOptions ? "arrow_drop_up" : "arrow_drop_down";
  // todo: make the button part of this sharable
  return (
    <div className="grants-search-filter-toggle grants-toggle grid-row flex-wrap">
      <div className="grid-col-4" />
      <a
        onClick={(_event) => setShowFilterOptions(!showFilterOptions)}
        aria-pressed={showFilterOptions}
        className="grid-col-4 usa-link text-bold grants-toggle-button"
      >
        <USWDSIcon name={iconName} className="usa-icon usa-icon--size-4" />
        <span>{buttonText}</span>
      </a>
    </div>
  );
}
