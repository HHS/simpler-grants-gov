import {
  ServerSideRouteParams,
  ServerSideSearchParams,
} from "../../types/searchRequestURLTypes";

import BetaAlert from "../../components/AppBetaAlert";
import { Metadata } from "next";
import React from "react";
import SearchCallToAction from "../../components/search/SearchCallToAction";
import { SearchForm } from "./SearchForm";
import { convertSearchParamsToProperTypes } from "../../utils/search/convertSearchParamsToProperTypes";
import { generateAgencyNameLookup } from "src/utils/search/generateAgencyNameLookup";
import { getSearchFetcher } from "../../services/search/searchfetcher/SearchFetcherUtil";
import { getTranslations } from "next-intl/server";
import withFeatureFlag from "../../hoc/search/withFeatureFlag";

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
async function Search({ searchParams }: ServerPageProps) {
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

export default withFeatureFlag(Search, "showSearchV0");
