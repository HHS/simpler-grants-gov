import { FeatureFlagsManager } from "../../services/FeatureFlagManager";
import PageSEO from "src/components/PageSEO";
import React from "react";
import SearchCallToAction from "../../components/search/SearchCallToAction";
import { SearchForm } from "./SearchForm";
import { cookies } from "next/headers";
import { getSearchFetcher } from "../../services/searchfetcher/SearchFetcherUtil";
import { notFound } from "next/navigation";


const searchFetcher = getSearchFetcher();

// TODO: use for i18n when ready
// interface RouteParams {
//   locale: string;
// }

interface ServerPageProps {
  params: {
    // route params
    slug: string;
  };
  searchParams: {
    // query string params
    [key: string]: string | string[] | undefined;
  };
}

export default async function Search({ searchParams }: ServerPageProps) {
  console.log("searchParams serer side =>", searchParams);

  const cookieStore = cookies();
  const ffManager = new FeatureFlagsManager(cookieStore);
  if (!ffManager.isFeatureEnabled("showSearchV0")) {
    return notFound();
  }


  const initialSearchResults = await searchFetcher.fetchOpportunities();

  return (
    <>
      {/* TODO: i18n */}
      <PageSEO
        title="Search Funding Opportunities"
        description="Try out our experimental search page."
      />
      <SearchCallToAction />
      <SearchForm initialSearchResults={initialSearchResults} />
    </>
  );
}
