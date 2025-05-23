import { Metadata } from "next";
import { environment } from "src/constants/environments";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { searchForOpportunities } from "src/services/fetch/fetchers/searchFetcher";
import QueryProvider from "src/services/search/QueryProvider";
import { OptionalStringDict } from "src/types/generalTypes";
import { LocalizedPageProps } from "src/types/intl";
import { Breakpoints } from "src/types/uiTypes";
import { convertSearchParamsToProperTypes } from "src/utils/search/searchUtils";

import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { use } from "react";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";
import { SaveSearchPanel } from "src/components/search/SaveSearchPanel";
import SearchAnalytics from "src/components/search/SearchAnalytics";
import SearchBar from "src/components/search/SearchBar";
import SearchFilters from "src/components/search/SearchFilters";
import SearchResults from "src/components/search/SearchResults";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Search.title"),
    description: t("Search.metaDescription"),
  };
  return meta;
}
type SearchPageProps = {
  searchParams: Promise<OptionalStringDict>;
  params: Promise<{ locale: string }>;
};

function Search({ searchParams, params }: SearchPageProps) {
  const { locale } = use(params);
  const resolvedSearchParams = use(searchParams);
  setRequestLocale(locale);
  const t = useTranslations("Search");

  const convertedSearchParams =
    convertSearchParamsToProperTypes(resolvedSearchParams);
  const { agency, category, eligibility, fundingInstrument, query, status } =
    convertedSearchParams;

  if (!("page" in resolvedSearchParams)) {
    resolvedSearchParams.page = "1";
  }

  const searchResultsPromise = searchForOpportunities(convertedSearchParams);

  return (
    <>
      <SearchAnalytics
        params={resolvedSearchParams}
        newRelicEnabled={environment.NEW_RELIC_ENABLED === "true"}
      />
      <QueryProvider>
        <div className="grid-container">
          <div className="search-bar">
            <SearchBar queryTermFromParent={query} />
          </div>
          <div className="grid-row grid-gap">
            <div className="tablet:grid-col-4">
              <ContentDisplayToggle
                showCallToAction={t("filterDisplayToggle.showFilters")}
                hideCallToAction={t("filterDisplayToggle.hideFilters")}
                breakpoint={Breakpoints.TABLET}
                type="centered"
              >
                <SaveSearchPanel />
                <SearchFilters
                  opportunityStatus={status}
                  eligibility={eligibility}
                  category={category}
                  fundingInstrument={fundingInstrument}
                  agency={agency}
                  searchResultsPromise={searchResultsPromise}
                />
              </ContentDisplayToggle>
            </div>
            <div className="tablet:grid-col-8">
              <SearchResults
                searchParams={convertedSearchParams}
                query={query}
                loadingMessage={t("loading")}
                searchResultsPromise={searchResultsPromise}
              ></SearchResults>
            </div>
          </div>
        </div>
      </QueryProvider>
    </>
  );
}

// Exports page behind both feature flags
export default withFeatureFlag<SearchPageProps, never>(
  Search,
  "searchOff",
  () => redirect("/maintenance"),
);
