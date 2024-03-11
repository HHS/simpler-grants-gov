import React from "react";
import { ReadonlyURLSearchParams } from "next/navigation";

interface SearchBarProps {
  handleSearch: (searchTerm: string) => void;
  searchParams: ReadonlyURLSearchParams;
}

export default function SearchBar({
  handleSearch,
  searchParams,
}: SearchBarProps) {
  return (
    <div className="usa-search usa-search--big" role="search">
      <label className="usa-sr-only" htmlFor="search-field">
        Search
      </label>
      <input
        className="usa-input maxw-none"
        id="search-field"
        type="search"
        name="search-text-input"
      />

      <button className="usa-button" type="submit">
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
