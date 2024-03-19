"use client";

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
    <div className="usa-search usa-search--big" role="search">
      <label className="usa-sr-only" htmlFor="search-field">
        Search
      </label>
      <input
        className="usa-input maxw-none"
        id="search-field"
        type="search"
        name="query"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />

      <button className="usa-button" type="submit" onClick={handleSubmit}>
        <span className="usa-search__submit-text">Search </span>
        {/* <img
          src="/assets/img/usa-icons-bg/search--white.svg"
          className="usa-search__submit-icon"
          alt="Search"
        /> */}
      </button>
    </div>
  );
}
