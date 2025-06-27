import { environment } from "src/constants/environments";
import { obtainAgencies } from "src/services/fetch/fetchers/agenciesFetcher";
import { searchForOpportunities } from "src/services/fetch/fetchers/searchFetcher";
import QueryProvider from "src/services/search/QueryProvider";
import { OptionalStringDict } from "src/types/generalTypes";
import { convertSearchParamsToProperTypes } from "src/utils/search/searchUtils";

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";

import { DrawerUnit } from "src/components/drawer/DrawerUnit";
import { SaveSearchPanel } from "src/components/search/SaveSearchPanel";
import SearchAnalytics from "src/components/search/SearchAnalytics";
import SearchBar from "src/components/search/SearchBar";
import SearchResults from "src/components/search/SearchResults";
import { Pill } from "../Pill";
import { AndOrPanel } from "./AndOrPanel";
import { FilterPillPanel } from "./FilterPillPanel";
import { PillList } from "./PillList";
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
  const agencyListPromise = obtainAgencies();

  return (
    <>
      <SearchAnalytics
        params={resolvedSearchParams}
        newRelicEnabled={environment.NEW_RELIC_ENABLED === "true"}
      />
      <QueryProvider>
        <div className="grid-container">
          <div className="desktop:display-flex desktop:margin-bottom-2">
            <div className="flex-6 flex-align-self-end">
              <SearchBar
                tableView={true}
                queryTermFromParent={convertedSearchParams.query}
              />
            </div>
            <div className="display-flex desktop:flex-5">
              <div className="flex-2 flex-align-self-end">
                <DrawerUnit
                  drawerId="search-filter-drawer"
                  closeText={t("drawer.submit")}
                  openText={t("filterDisplayToggle.drawer")}
                  headingText={<SearchDrawerHeading />}
                  iconName="filter_list"
                >
                  <SearchDrawerFilters
                    searchParams={convertedSearchParams}
                    searchResultsPromise={searchResultsPromise}
                    agencyListPromise={agencyListPromise}
                  />
                </DrawerUnit>
              </div>
              <div className="flex-3 flex-align-self-end">
                <SaveSearchPanel />
              </div>
            </div>
          </div>
          <AndOrPanel hasSearchTerm={!!convertedSearchParams.query} />
          <Suspense
            fallback={
              <div className="display-flex">
                <div className="flex-1 flex-align-self-center">Loading...</div>
                <div className="opacity-0 flex-1">
                  <PillList
                    pills={[
                      {
                        label: "",
                        queryParamKey: "status",
                        queryParamValue: "",
                      },
                    ]}
                  />
                </div>
              </div>
            }
          >
            <FilterPillPanel
              searchParams={convertedSearchParams}
              agencyListPromise={agencyListPromise}
            />
          </Suspense>
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
