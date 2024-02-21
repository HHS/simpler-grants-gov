import type { GetStaticProps, NextPage } from "next";
import React, { useState } from "react";
import {
  SearchFetcher,
  fetchSearchOpportunities,
} from "../services/searchfetcher/SearchFetcher";

import { APISearchFetcher } from "../services/searchfetcher/APISearchFetcher";
import { MockSearchFetcher } from "../services/searchfetcher/MockSearchFetcher";
import { Opportunity } from "../types/search";
import PageNotFound from "./404";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";

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

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  // Always pre-render the initial search results
  // TODO (1189): If the URL has query params - they will need to be included in the search here
  const initialOpportunities: Opportunity[] = await fetchSearchOpportunities(
    searchFetcher
  );
  const translations = await serverSideTranslations(locale ?? "en");

  return {
    props: {
      initialOpportunities,
      ...translations,
    },
  };
};

export default Search;
