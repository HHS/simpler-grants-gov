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
  return (
    <div className="search-filter-toggle">
      <button onClick={(_event) => setShowFilterOptions(!showFilterOptions)}>
        <USWDSIcon name={"Arrow Drop Down"} className="" />
        <span>{buttonText}</span>
      </button>
    </div>
  );
}
