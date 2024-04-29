import {
  ServerSideRouteParams,
  ServerSideSearchParams,
} from "../../types/searchRequestURLTypes";

import BetaAlert from "../../components/AppBetaAlert";
import { FeatureFlagsManager } from "../../services/FeatureFlagManager";
import { Metadata } from "next";
import React from "react";
import SearchCallToAction from "../../components/search/SearchCallToAction";
import { SearchForm } from "./SearchForm";
import { convertSearchParamsToProperTypes } from "../../utils/search/convertSearchParamsToProperTypes";
import { cookies } from "next/headers";
import { generateAgencyNameLookup } from "src/utils/search/generateAgencyNameLookup";
import { getSearchFetcher } from "../../services/search/searchfetcher/SearchFetcherUtil";
import { getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

const searchFetcher = getSearchFetcher();

interface RouteParams {
  locale: string;
}

interface ServerPageProps {
  params: ServerSideRouteParams;
  searchParams: ServerSideSearchParams;
  locale?: string;
}

export async function generateMetadata({ params }: { params: RouteParams }) {
  const t = await getTranslations({ locale: params.locale });
  const meta: Metadata = {
    title: t("Search.title"),
    description: t("Search.description"),
  };

  return meta;
}

export default async function Search({ searchParams }: ServerPageProps) {
  const messages = await getMessages();
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
      <NextIntlClientProvider locale="en" messages={messages}>
        <BetaAlert />
      </NextIntlClientProvider>
      <SearchCallToAction />
      <SearchForm
        initialSearchResults={initialSearchResults}
        requestURLQueryParams={convertedSearchParams}
        agencyNameLookup={generateAgencyNameLookup()}
      />
    </>
  );
}
