import { Metadata } from "next";
import Loading from "src/app/[locale]/search/loading";
import QueryProvider from "src/app/[locale]/search/QueryProvider";
import { SEARCH_CRUMBS } from "src/constants/breadcrumbs";
import withFeatureFlag from "src/hoc/search/withFeatureFlag";
import { Breakpoints } from "src/types/uiTypes";
import { convertSearchParamsToProperTypes } from "src/utils/search/convertSearchParamsToProperTypes";

import { useTranslations } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import ContentDisplayToggle from "src/components/ContentDisplayToggle";
import PageSEO from "src/components/PageSEO";
import SearchBar from "src/components/search/SearchBar";
import SearchCallToAction from "src/components/search/SearchCallToAction";
import SearchFilters from "src/components/search/SearchFilters";
import SearchPagination from "src/components/search/SearchPagination";
import SearchPaginationFetch from "src/components/search/SearchPaginationFetch";
import SearchResultsHeader from "src/components/search/SearchResultsHeader";
import SearchResultsHeaderFetch from "src/components/search/SearchResultsHeaderFetch";
import SearchResultsListFetch from "src/components/search/SearchResultsListFetch";

export async function generateMetadata() {
  const t = await getTranslations({ locale: "en" });
  const meta: Metadata = {
    title: t("Search.title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

interface searchParamsTypes {
  agency?: string;
  category?: string;
  eligibility?: string;
  fundingInstrument?: string;
  page?: string;
  query?: string;
  sortby?: string;
  status?: string;
  [key: string]: string | undefined;
}

function Search({ searchParams }: { searchParams: searchParamsTypes }) {
  unstable_setRequestLocale("en");
  const t = useTranslations("Search");
  const convertedSearchParams = convertSearchParamsToProperTypes(searchParams);
  const {
    agency,
    category,
    eligibility,
    fundingInstrument,
    page,
    query,
    sortby,
    status,
  } = convertedSearchParams;

  if (!("page" in searchParams)) {
    searchParams.page = "1";
  }
  const key = Object.entries(searchParams).join(",");
  const pager1key = Object.entries(searchParams).join("-") + "pager1";
  const pager2key = Object.entries(searchParams).join("-") + "pager2";

  return (
    <>
      <PageSEO title={t("title")} description={t("meta_description")} />
      <BetaAlert />
      <Breadcrumbs breadcrumbList={SEARCH_CRUMBS} />
      <SearchCallToAction />
      <QueryProvider>
        <div className="grid-container">
          <div className="search-bar">
            <SearchBar query={query} />
          </div>
          <div className="grid-row grid-gap">
            <div className="tablet:grid-col-4">
              <ContentDisplayToggle
                showCallToAction={t("filterDisplayToggle.showFilters")}
                hideCallToAction={t("filterDisplayToggle.hideFilters")}
                breakpoint={Breakpoints.TABLET}
              >
                <SearchFilters
                  opportunityStatus={status}
                  eligibility={eligibility}
                  category={category}
                  fundingInstrument={fundingInstrument}
                  agency={agency}
                />
              </ContentDisplayToggle>
            </div>
            <div className="tablet:grid-col-8">
              <Suspense
                key={key}
                fallback={
                  <SearchResultsHeader sortby={sortby} loading={false} />
                }
              >
                <SearchResultsHeaderFetch
                  sortby={sortby}
                  queryTerm={query}
                  searchParams={convertedSearchParams}
                />
              </Suspense>
              <div className="usa-prose">
                <Suspense
                  key={pager1key}
                  fallback={
                    <SearchPagination
                      loading={true}
                      page={page}
                      query={query}
                    />
                  }
                >
                  <SearchPaginationFetch
                    searchParams={convertedSearchParams}
                    scroll={false}
                  />
                </Suspense>
                <Suspense
                  key={key}
                  fallback={<Loading message={t("loading")} />}
                >
                  <SearchResultsListFetch
                    searchParams={convertedSearchParams}
                  />
                </Suspense>
                <Suspense
                  key={pager2key}
                  fallback={
                    <SearchPagination
                      loading={true}
                      page={page}
                      query={query}
                    />
                  }
                >
                  <SearchPaginationFetch
                    searchParams={convertedSearchParams}
                    scroll={true}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </QueryProvider>
    </>
  );
}

// Exports page behind a feature flag
export default withFeatureFlag(Search, "showSearchV0");
