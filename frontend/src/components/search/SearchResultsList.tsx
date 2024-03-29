"use client";

import Loading from "../../app/search/loading";
import { SearchResponseData } from "../../types/search/searchResponseTypes";
import { useFormStatus } from "react-dom";
import SearchResultsListItem from "./SearchResultsListItem";

interface SearchResultsListProps {
  searchResults: SearchResponseData;
  maxPaginationError: boolean;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
  searchResults,
  maxPaginationError,
}) => {
  const { pending } = useFormStatus();

  if (pending) {
    return <Loading />;
  }

  if (searchResults.length === 0) {
    return (
      <div>
        <h2>Your search did not return any results.</h2>
        <p>Select at least one status.</p>
        <ul>
          <li>{"Check any terms you've entered for typos"}</li>
          <li>Try different keywords</li>
          <li>{"Make sure you've selected the right statuses"}</li>
          <li>Try resetting filters or selecting fewer options</li>
        </ul>
      </div>
    );
  }

  return (
    <ul className="usa-list--unstyled">
      {/* TODO #1485: show proper USWDS error  */}
      {maxPaginationError && (
        <h4>
          {
            "You''re trying to access opportunity results that are beyond the last page of data."
          }
        </h4>
      )}
      {searchResults.map((opportunity) => (
        <li key={opportunity?.opportunity_id}>
          <SearchResultsListItem opportunity={opportunity} />
        </li>
      ))}
    </ul>
  );
};

export default SearchResultsList;
