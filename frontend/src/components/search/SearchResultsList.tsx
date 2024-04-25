"use client";

import { AgencyNamyLookup } from "src/utils/search/generateAgencyNameLookup";
import Loading from "../../app/[locale]/search/loading";
import SearchErrorAlert from "src/components/search/error/SearchErrorAlert";
import { SearchResponseData } from "../../types/search/searchResponseTypes";
import SearchResultsListItem from "./SearchResultsListItem";
import { useFormStatus } from "react-dom";

interface SearchResultsListProps {
  searchResults: SearchResponseData;
  maxPaginationError: boolean;
  agencyNameLookup?: AgencyNamyLookup;
  errors?: unknown[] | null | undefined; // If passed in, there's been an issue with the fetch call
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
  searchResults,
  maxPaginationError,
  agencyNameLookup,
  errors,
}) => {
  const { pending } = useFormStatus();

  if (pending) {
    return <Loading />;
  }

  if (errors) {
    return <SearchErrorAlert />;
  }

  if (searchResults?.length === 0) {
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
      {searchResults?.map((opportunity) => (
        <li key={opportunity?.opportunity_id}>
          <SearchResultsListItem
            opportunity={opportunity}
            agencyNameLookup={agencyNameLookup}
          />
        </li>
      ))}
    </ul>
  );
};

export default SearchResultsList;
