"use client";

import React, { useState } from "react";
import {
  SearchFetcher,
  fetchSearchOpportunities,
} from "../../services/searchfetcher/SearchFetcher";

import { APISearchFetcher } from "../../services/searchfetcher/APISearchFetcher";
import { MockSearchFetcher } from "../../services/searchfetcher/MockSearchFetcher";
import PageNotFound from "../../pages/404";
import { SearchResponseData } from "../../api/SearchOpportunityAPI";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";

const useMockData = false;
const searchFetcher: SearchFetcher = useMockData
  ? new MockSearchFetcher()
  : new APISearchFetcher();

// TODO: use for i18n when ready
// interface RouteParams {
//   locale: string;
// }

export default function Search() {
  const { featureFlagsManager, mounted } = useFeatureFlags();
  const [searchResults, setSearchResults] = useState<SearchResponseData>([]);

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    performSearch().catch((e) => console.log(e));
  };

  const performSearch = async () => {
    const opportunities = await fetchSearchOpportunities(searchFetcher);
    setSearchResults(opportunities);
  };

  if (!mounted) return null;
  if (!featureFlagsManager.isFeatureEnabled("showSearchV0")) {
    return <PageNotFound />;
  }

  return (
    <>
      <button onClick={handleButtonClick}>Update Results</button>
      {searchFetcher instanceof APISearchFetcher ? (
        <p>Live API</p>
      ) : (
        <p>Mock Call</p>
      )}
      <ul>
        {searchResults.map((opportunity) => (
          <li key={opportunity.opportunity_id}>
            {opportunity.category}, {opportunity.opportunity_title}
          </li>
        ))}
      </ul>
    </>
  );
}
