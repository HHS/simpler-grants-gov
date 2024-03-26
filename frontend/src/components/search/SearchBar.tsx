"use client";

import { Icon } from "@trussworks/react-uswds";
import { useSearchParamUpdater } from "../../hooks/useSearchParamUpdater";
import { useState } from "react";

interface SearchBarProps {
  initialQueryParams: string;
}

export default function SearchBar({ initialQueryParams }: SearchBarProps) {
  const [inputValue, setInputValue] = useState<string>(initialQueryParams);
  const { updateQueryParams } = useSearchParamUpdater();

  const handleSubmit = () => {
    updateQueryParams(inputValue, "query");
  };

  return (
    <div className="margin-top-5 margin-bottom-2">
      <label
        htmlFor="query"
        className="font-sans-lg display-block margin-bottom-2"
      >
        <span className="text-bold">Search terms </span>
        <small className="inline-block">
          Enter keywords, opportunity numbers, or assistance listing numbers
        </small>
      </label>
      <div className="usa-search usa-search--big" role="search">
        <input
          className="usa-input maxw-none"
          id="query"
          type="search"
          name="query"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />

        <button className="usa-button" type="submit" onClick={handleSubmit}>
          <span className="usa-search__submit-text">Search </span>
          <Icon.Search
            className="usa-search__submit-icon"
            size={4}
            aria-label="Search"
          />
        </button>
      </div>
    </div>
  );
}
