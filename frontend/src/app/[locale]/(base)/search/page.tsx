import { Metadata } from "next";
import { environment } from "src/constants/environments";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { performAgencySearch } from "src/services/fetch/fetchers/agenciesFetcher";
import { getSavedOpportunities } from "src/services/fetch/fetchers/savedOpportunityFetcher";
import { searchForOpportunities } from "src/services/fetch/fetchers/searchFetcher";
import QueryProvider from "src/services/search/QueryProvider";
import { OptionalStringDict } from "src/types/generalTypes";
import { LocalizedPageProps } from "src/types/intl";
import { convertSearchParamsToProperTypes } from "src/utils/search/searchUtils";

import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense, use } from "react";

import BetaAlert from "src/components/BetaAlert";
import { DrawerUnit } from "src/components/drawer/DrawerUnit";
import { AndOrPanel } from "src/components/search/AndOrPanel";
import { FilterPillPanel } from "src/components/search/FilterPillPanel";
import { PillListSkeleton } from "src/components/search/PillList";
import { SaveSearchPanel } from "src/components/search/SaveSearchPanel";
import SearchAnalytics from "src/components/search/SearchAnalytics";
import { SearchBarWithLabel } from "src/components/search/SearchBarWithLabel";
import SearchCallToAction from "src/components/search/SearchCallToAction";
import { SearchDrawerFilters } from "src/components/search/SearchDrawerFilters";
import { SearchDrawerHeading } from "src/components/search/SearchDrawerHeading";
import SearchResults from "src/components/search/SearchResults";

type SearchPageProps = {
  searchParams: Promise<OptionalStringDict>;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Search.title"),
    description: t("Search.metaDescription"),
  };
  return meta;
}

function Search({ searchParams, params }: SearchPageProps) {
  const { locale } = use(params);
  const resolvedSearchParams = use(searchParams);
  setRequestLocale(locale);
  const t = useTranslations("Search");

  const convertedSearchParams =
    convertSearchParamsToProperTypes(resolvedSearchParams);

  if (!("page" in resolvedSearchParams)) {
    resolvedSearchParams.page = "1";
  }

  const searchResultsPromise = searchForOpportunities(convertedSearchParams);

  // this represents the list of agencies as filtered based on the user's selected opportunity status
  // to be used to form the list of agencies available from the agency filter
  const filteredAgencyListPromise = performAgencySearch({
    selectedStatuses: Array.from(convertedSearchParams.status),
  });

  // this represents the list of ALL agencies regardless of the user's selected opportunity status
  // since a user may have agencies selected in a filter that only have archived / close opportunities
  // and may then alter the list of agency options by deselecting archived / closed status
  // this full list ensures that filter pills will always have labels regardless of opportunity status selection
  const agencyListPromise = performAgencySearch();

  const savedOpportunitiesPromise = getSession().then((session) =>
    session ? getSavedOpportunities(session.token, session.user_id) : [],
  );

  return (
    <QueryProvider>
      <SearchAnalytics
        params={resolvedSearchParams}
        newRelicEnabled={environment.NEW_RELIC_ENABLED === "true"}
      />
      <div className="bg-base-lightest">
        <BetaAlert
          containerClasses="padding-y-3"
          alertMessage={t.rich("betaAlert.alert", {
            ethnioSurveyLink: (chunks) => (
              <a
                href="https://ethn.io/16188"
                target="_blank"
                className="usa-link--external"
              >
                {chunks}
              </a>
            ),
          })}
        />
        <div className="grid-container">
          <SearchCallToAction />
          <div className="tablet:display-flex tablet:margin-bottom-2 margin-top-0">
            <div className="flex-6 flex-align-self-end">
              <SearchBarWithLabel
                tableView={true}
                queryTermFromParent={convertedSearchParams.query}
              />
            </div>
            <div className="display-flex tablet:flex-2 desktop:flex-5 margin-y-2 tablet:margin-y-0">
              <div className="flex-2 flex-align-self-end">
                <DrawerUnit
                  drawerId="search-filter-drawer"
                  closeText={t("drawer.submit")}
                  openText={t("drawer.toggleButton")}
                  headingText={<SearchDrawerHeading />}
                  iconName="filter_list"
                  buttonClass="tablet:margin-x-auto"
                >
                  <SearchDrawerFilters
                    searchParams={convertedSearchParams}
                    searchResultsPromise={searchResultsPromise}
                    agencyListPromise={filteredAgencyListPromise}
                  />
                </DrawerUnit>
              </div>
              <div className="flex-3 flex-align-self-end display-none desktop:display-block">
                <SaveSearchPanel />
              </div>
            </div>
          </div>
          <AndOrPanel hasSearchTerm={!!convertedSearchParams.query} />
          <Suspense fallback={<PillListSkeleton />}>
            <FilterPillPanel
              searchParams={convertedSearchParams}
              agencyListPromise={agencyListPromise}
            />
          </Suspense>
        </div>
      </div>
      <div className="grid-container">
        <SearchResults
          searchParams={convertedSearchParams}
          searchResultsPromise={searchResultsPromise}
          savedOpportunitiesPromise={savedOpportunitiesPromise}
        ></SearchResults>
      </div>
    </QueryProvider>
  );
}

export default withFeatureFlag<SearchPageProps, never>(
  Search,
  "searchOff",
  () => redirect("/maintenance"),
);
