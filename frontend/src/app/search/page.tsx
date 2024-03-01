"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import React, { useState } from "react";

import PageNotFound from "../../pages/404";
import { APISearchFetcher } from "../../services/searchfetcher/APISearchFetcher";
import { MockSearchFetcher } from "../../services/searchfetcher/MockSearchFetcher";
import {
  fetchSearchOpportunities,
  SearchFetcher,
} from "../../services/searchfetcher/SearchFetcher";
import { Opportunity } from "../../types/searchTypes";

const useMockData = true;
const searchFetcher: SearchFetcher = useMockData
  ? new MockSearchFetcher()
  : new APISearchFetcher();

// TODO: use for i18n when ready
// interface RouteParams {
//   locale: string;
// }

// interface SearchProps {
//   initialOpportunities: Opportunity[];
// }

export default function Search() {
  const { featureFlagsManager, mounted } = useFeatureFlags();
  const [searchResults, setSearchResults] = useState<Opportunity[]>([]);

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
      <ul>
        {searchResults.map((opportunity) => (
          <li key={opportunity.agency}>
            {opportunity.category}, {opportunity.opportunity_title}
          </li>
        ))}
      </ul>
    </>
  );
}
