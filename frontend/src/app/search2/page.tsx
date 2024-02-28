"use client";
import type { GetStaticProps, NextPage } from "next";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React, { useState } from "react";

import { APISearchFetcher } from "../../services/searchfetcher/APISearchFetcher";
import { MockSearchFetcher } from "../../services/searchfetcher/MockSearchFetcher";
import {
  fetchSearchOpportunities,
  SearchFetcher,
} from "../../services/searchfetcher/SearchFetcher";
import { Opportunity } from "../../types/searchTypes";
import PageNotFound from "../../pages/404";

const useMockData = true;
const searchFetcher: SearchFetcher = useMockData
  ? new MockSearchFetcher()
  : new APISearchFetcher();

interface SearchProps {
  initialOpportunities: Opportunity[];
}

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
