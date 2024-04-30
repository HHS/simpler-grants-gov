import {
  ServerSideRouteParams,
  ServerSideSearchParams,
} from "../../types/searchRequestURLTypes";

import BetaAlert from "../../components/AppBetaAlert";
import { FeatureFlagsManager } from "../../services/FeatureFlagManager";
import React from "react";
import SearchCallToAction from "../../components/search/SearchCallToAction";
import { SearchForm } from "./SearchForm";
import { convertSearchParamsToProperTypes } from "../../utils/search/convertSearchParamsToProperTypes";
import { cookies } from "next/headers";
import { generateAgencyNameLookup } from "src/utils/search/generateAgencyNameLookup";
import { getSearchFetcher } from "../../services/search/searchfetcher/SearchFetcherUtil";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";

const searchFetcher = getSearchFetcher();

interface ServerPageProps {
  params: ServerSideRouteParams;
  searchParams: ServerSideSearchParams;
}

export async function generateMetadata() {
  const t = await getTranslations({ locale: "en" });
  const meta: Metadata = {
    title: t("Search.title"),
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
      <BetaAlert />
      <SearchCallToAction />
      <SearchForm
        initialSearchResults={initialSearchResults}
        requestURLQueryParams={convertedSearchParams}
        agencyNameLookup={generateAgencyNameLookup()}
      />
    </>
  );
}
