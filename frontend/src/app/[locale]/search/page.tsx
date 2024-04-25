import {
  ServerSideRouteParams,
  ServerSideSearchParams,
} from "../../../types/searchRequestURLTypes";

import BetaAlert from "../../../components/BetaAlert";
import { FeatureFlagsManager } from "../../../services/FeatureFlagManager";
import { Metadata } from "next";
import React from "react";
import SearchCallToAction from "../../../components/search/SearchCallToAction";
import { SearchForm } from "./SearchForm";
import { convertSearchParamsToProperTypes } from "../../../utils/search/convertSearchParamsToProperTypes";
import { cookies } from "next/headers";
import { generateAgencyNameLookup } from "src/utils/search/generateAgencyNameLookup";
import { getSearchFetcher } from "../../../services/search/searchfetcher/SearchFetcherUtil";
import { notFound } from "next/navigation";

const searchFetcher = getSearchFetcher();

// TODO: use for i18n when ready
// interface RouteParams {
//   locale: string;
// }

interface ServerPageProps {
  params: ServerSideRouteParams;
  searchParams: ServerSideSearchParams;
}

export function generateMetadata() {
  // TODO: use the following for i18n const t = await getTranslations({ locale: params.locale });
  const meta: Metadata = {
    title: "Search Funding Opportunities | Simpler.Grants.gov",
    description: "Try out our experimental search page.",
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

  const beta_strings = {
    alert_title:
      "Attention! Go to <LinkToGrants>www.grants.gov</LinkToGrants> to search and apply for grants.",
    alert:
      "Simpler.Grants.gov is a work in progress. Thank you for your patience as we build this new website.",
  };

  return (
    <>
      <BetaAlert beta_strings={beta_strings} />
      <SearchCallToAction />
      <SearchForm
        initialSearchResults={initialSearchResults}
        requestURLQueryParams={convertedSearchParams}
        agencyNameLookup={generateAgencyNameLookup()}
      />
    </>
  );
}
