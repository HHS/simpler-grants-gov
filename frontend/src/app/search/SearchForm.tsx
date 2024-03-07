"use client";

import { useFormState, useFormStatus } from "react-dom";

import Loading from "./loading";
import { SearchResponseData } from "../api/SearchOpportunityAPI";
import { updateResults } from "./actions";

interface SearchResultsListProps {
  searchResults: SearchResponseData;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
  searchResults,
}) => {
  // useFormStatus only works here because this component's
  // parent is the form
  const { pending } = useFormStatus();
  if (pending) {
    return <Loading />;
  }

  return (
    <ul>
      {searchResults.map((opportunity) => (
        <li key={opportunity.opportunity_id}>
          {opportunity.category}, {opportunity.opportunity_title}
        </li>
      ))}
    </ul>
  );
};

interface SearchFormProps {
  initialSearchResults: SearchResponseData;
}

export function SearchForm({ initialSearchResults }: SearchFormProps) {
  const [searchResults, updateSearchResultAction] = useFormState(
    updateResults,
    initialSearchResults,
  );

  return (
    <>
      <form action={updateSearchResultAction}>
        <input type="text" name="mytext" />
        <input type="checkbox" name="mycheckbox" />
        <input type="hidden" name="hiddeninput" value={22} />
        <select name="mydropdown" id="dog-names">
          <option value="a">a</option>
          <option value="b">b</option>
        </select>
        <input type="submit" value="Search" />
        <SearchResultsList searchResults={searchResults} />
      </form>
    </>
  );
}
