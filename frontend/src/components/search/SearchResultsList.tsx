import Loading from "../../app/search/loading";
// SearchResultsList.tsx
import React from "react";
import { SearchResponseData } from "../../app/api/SearchOpportunityAPI";
import { useFormStatus } from "react-dom";

interface SearchResultsListProps {
  searchResults: SearchResponseData;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
  searchResults,
}) => {
  const { pending } = useFormStatus();

  if (pending) {
    return <Loading />;
  }

  return (
    <div>
      <h4>{searchResults.length} Opportunities</h4>
      <ul>
        {searchResults.map((opportunity) => (
          <li key={opportunity.opportunity_id}>
            {opportunity.category}, {opportunity.opportunity_title},{" "}
            {opportunity.summary.close_date}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchResultsList;
