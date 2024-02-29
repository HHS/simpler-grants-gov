"use client";

import React, { useState } from "react";
import {
  SearchFetcher,
  fetchSearchOpportunities,
} from "../../services/searchfetcher/SearchFetcher";

import { APISearchFetcher } from "../../services/searchfetcher/APISearchFetcher";
import { MockSearchFetcher } from "../../services/searchfetcher/MockSearchFetcher";
import type { NextPage } from "next";
import { Opportunity } from "../../types/searchTypes";
import PageNotFound from "../../pages/404";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";

const useMockData = true;
const searchFetcher: SearchFetcher = useMockData
  ? new MockSearchFetcher()
  : new APISearchFetcher();

interface SearchProps {
  initialOpportunities: Opportunity[];
}

// TODO: use for 
// interface RouteParams {
//   locale: string;
// }

const Search: NextPage<SearchProps> = ({ initialOpportunities = [] }) => {
  const { featureFlagsManager, mounted } = useFeatureFlags();
  const [searchResults, setSearchResults] =
    useState<Opportunity[]>(initialOpportunities);

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
          <li key={opportunity.id}>
            {opportunity.id}, {opportunity.title}
          </li>
        ))}
      </ul>
    </>
  );
};

export default Search;
