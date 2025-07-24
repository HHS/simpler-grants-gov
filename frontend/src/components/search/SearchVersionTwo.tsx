import { SEARCH_CRUMBS } from "src/constants/breadcrumbs";
import { environment } from "src/constants/environments";
import { performAgencySearch } from "src/services/fetch/fetchers/agenciesFetcher";
import { searchForOpportunities } from "src/services/fetch/fetchers/searchFetcher";
import QueryProvider from "src/services/search/QueryProvider";
import { OptionalStringDict } from "src/types/generalTypes";
import { convertSearchParamsToProperTypes } from "src/utils/search/searchUtils";

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import { DrawerUnit } from "src/components/drawer/DrawerUnit";
import { SaveSearchPanel } from "src/components/search/SaveSearchPanel";
import SearchAnalytics from "src/components/search/SearchAnalytics";
import SearchResults from "src/components/search/SearchResults";
import { AndOrPanel } from "./AndOrPanel";
import { FilterPillPanel } from "./FilterPillPanel";
import { PillListSkeleton } from "./PillList";
import { NewSearchBar } from "./SearchBarWithLabel";
import SearchCallToAction from "./SearchCallToAction";
import { SearchDrawerFilters } from "./SearchDrawerFilters";
import { SearchDrawerHeading } from "./SearchDrawerHeading";

export function SearchVersionTwo({
  searchParams,
  params,
}: {
  searchParams: Promise<OptionalStringDict>;
  params: Promise<{ locale: string }>;
}) {
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
  const agencyListPromise = performAgencySearch({
    selectedStatuses: Array.from(convertedSearchParams.status),
  });

  return (
    <QueryProvider>
      <SearchAnalytics
        params={resolvedSearchParams}
        newRelicEnabled={environment.NEW_RELIC_ENABLED === "true"}
      />
      <div className="bg-base-lightest">
        <BetaAlert
          containerClasses="padding-top-5"
          heading={t("betaAlert.alertTitle")}
          alertMessage={t.rich("betaAlert.alert", {
            ethnioSurveyLink: (chunks) => (
              <a href="https://ethn.io/16188" target="_blank" className="usa-link--external">
                {chunks}
              </a>
            ),
          })}
        />
        <div className="grid-container">
          <Breadcrumbs
            breadcrumbList={SEARCH_CRUMBS}
            className="bg-base-lightest"
          />
          <SearchCallToAction />
          <div className="tablet:display-flex tablet:margin-bottom-2 margin-top-0">
            <div className="flex-6 flex-align-self-end">
              <NewSearchBar
                tableView={true}
                queryTermFromParent={convertedSearchParams.query}
              />
            </div>
            <div className="display-flex tablet:flex-2 desktop:flex-5 margin-y-2 tablet:margin-y-0">
              <div className="flex-2 flex-align-self-end">
                <DrawerUnit
                  drawerId="search-filter-drawer"
                  closeText={t("drawer.submit")}
                  openText={t("filterDisplayToggle.drawer")}
                  headingText={<SearchDrawerHeading />}
                  iconName="filter_list"
                  buttonClass="tablet:margin-x-auto"
                >
                  <SearchDrawerFilters
                    searchParams={convertedSearchParams}
                    searchResultsPromise={searchResultsPromise}
                    agencyListPromise={agencyListPromise}
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
          loadingMessage={t("loading")}
          searchResultsPromise={searchResultsPromise}
        ></SearchResults>
      </div>
    </QueryProvider>
  );
}
