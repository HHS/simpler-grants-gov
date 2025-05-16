import { environment } from "src/constants/environments";
import { searchForOpportunities } from "src/services/fetch/fetchers/searchFetcher";
import QueryProvider from "src/services/search/QueryProvider";
import { OptionalStringDict } from "src/types/generalTypes";
import { Breakpoints } from "src/types/uiTypes";
import { convertSearchParamsToProperTypes } from "src/utils/search/searchUtils";

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";
import { DrawerUnit } from "src/components/drawer/DrawerUnit";
import { SaveSearchPanel } from "src/components/search/SaveSearchPanel";
import SearchAnalytics from "src/components/search/SearchAnalytics";
import SearchBar from "src/components/search/SearchBar";
import SearchResults from "src/components/search/SearchResults";
import { SearchDrawerFilters } from "./SearchDrawerFilters";

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

  return (
    <>
      <SearchAnalytics
        params={resolvedSearchParams}
        newRelicEnabled={environment.NEW_RELIC_ENABLED === "true"}
      />
      <QueryProvider>
        <div className="grid-container">
          <div className="display-flex margin-bottom-2">
            <div className="flex-6">
              <SearchBar
                tableView={true}
                queryTermFromParent={convertedSearchParams.query}
              />
            </div>
            <div className="flex-2 flex-align-self-end">
              <DrawerUnit
                drawerId="search-filter-drawer"
                closeText={t("drawer.submit")}
                openText={t("filterDisplayToggle.drawer")}
                headingText={t("drawer.title")}
                iconName="filter_list"
              >
                <SearchDrawerFilters
                  searchParams={convertedSearchParams}
                  searchResultsPromise={searchResultsPromise}
                />
              </DrawerUnit>
            </div>
            <div className="flex-3 flex-align-self-end">
              <SaveSearchPanel />
            </div>
          </div>
          <SearchResults
            searchParams={convertedSearchParams}
            loadingMessage={t("loading")}
            searchResultsPromise={searchResultsPromise}
          ></SearchResults>
        </div>
      </QueryProvider>
    </>
  );
}
