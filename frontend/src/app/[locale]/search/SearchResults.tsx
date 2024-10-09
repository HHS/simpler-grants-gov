import Loading from "src/app/[locale]/search/loading";
import { QueryParamData } from "src/services/search/searchfetcher/SearchFetcher";

import { Suspense } from "react";

import SearchPagination from "src/components/search/SearchPagination";
import SearchPaginationFetch from "src/components/search/SearchPaginationFetch";
import SearchResultsHeader from "src/components/search/SearchResultsHeader";
import SearchResultsHeaderFetch from "src/components/search/SearchResultsHeaderFetch";
import SearchResultsListFetch from "src/components/search/SearchResultsListFetch";

export default function SearchResults({
  searchParams,
  query,
  loadingMessage,
}: {
  searchParams: QueryParamData;
  query?: string | null;
  loadingMessage: string;
}) {
  const { page, sortby } = searchParams;

  const key = Object.entries(searchParams).join(",");
  const pager1key = Object.entries(searchParams).join("-") + "pager1";
  const pager2key = Object.entries(searchParams).join("-") + "pager2";
  return (
    <div className="tablet:grid-col-8">
      <Suspense
        key={key}
        fallback={<SearchResultsHeader sortby={sortby} loading={false} />}
      >
        <SearchResultsHeaderFetch
          sortby={sortby}
          queryTerm={query}
          searchParams={searchParams}
        />
      </Suspense>
      <div className="usa-prose">
        <Suspense
          key={pager1key}
          fallback={
            <SearchPagination loading={true} page={page} query={query} />
          }
        >
          <SearchPaginationFetch searchParams={searchParams} scroll={false} />
        </Suspense>
        <Suspense key={key} fallback={<Loading message={loadingMessage} />}>
          <SearchResultsListFetch searchParams={searchParams} />
        </Suspense>
        <Suspense
          key={pager2key}
          fallback={
            <SearchPagination loading={true} page={page} query={query} />
          }
        >
          <SearchPaginationFetch searchParams={searchParams} scroll={true} />
        </Suspense>
      </div>
    </div>
  );
}
