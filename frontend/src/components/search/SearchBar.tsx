import React from "react";

export default function SearchBar() {
  return (
    <>
      <input
        className="usa-input"
        id="search-input-text"
        name="search-input"
        type="search"
        placeholder="Search a keyword"
      />
      <button className="usa-button search-submit-button" type="submit">
        Search
      </button>
    </>
  );
}
