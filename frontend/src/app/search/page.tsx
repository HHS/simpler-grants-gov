import {
  ServerSideRouteParams,
  ServerSideSearchParams,
} from "../../types/searchRequestURLTypes";
import { Metadata } from "next";

import { FeatureFlagsManager } from "../../services/FeatureFlagManager";
import React from "react";
import SearchCallToAction from "../../components/search/SearchCallToAction";
import { SearchForm } from "./SearchForm";
import { convertSearchParamsToProperTypes } from "../../utils/search/convertSearchParamsToProperTypes";
import { cookies } from "next/headers";
import { getSearchFetcher } from "../../services/search/searchfetcher/SearchFetcherUtil";
import { notFound } from "next/navigation";

interface RouteParams {
  locale: string;
}

const searchFetcher = getSearchFetcher();

// TODO: use for i18n when ready
// interface RouteParams {
//   locale: string;
// }

interface ServerPageProps {
  params: ServerSideRouteParams;
  searchParams: ServerSideSearchParams;
}

export async function generateMetadata({ params }: { params: RouteParams }) {
  // TODO: use the following for i18n const t = await getTranslations({ locale: params.locale });
  const meta: Metadata = {
    title: "Search Funding Opportunities | Simpler.Grants.gov",
    description: "Try out our experimental search page."
  };

  return meta;
}

export default async function Search({ searchParams }: ServerPageProps) {
  const ffManager = new FeatureFlagsManager(cookies());
  if (!ffManager.isFeatureEnabled("showSearchV0")) {
    return notFound();
  }

  const convertedSearchParams = convertSearchParamsToProperTypes(searchParams);
  const initialSearchResults = await searchFetcher.fetchOpportunities(
    convertedSearchParams,
  );

  return (
    <>
      <SearchCallToAction />
      <SearchForm
        initialSearchResults={initialSearchResults}
        requestURLQueryParams={convertedSearchParams}
      />
    </>
  );
}
