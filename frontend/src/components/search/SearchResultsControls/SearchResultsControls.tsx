import { useTranslations } from "next-intl";

import { ExportSearchResultsButton } from "src/components/search/ExportSearchResultsButton";
import SearchPagination from "src/components/search/SearchPagination";
import SearchSortBy from "src/components/search/SearchSortBy";

const gridRowClasses = [
  "tablet-lg:grid-col-fill",
  "margin-top-5",
  "tablet-lg:margin-top-2",
  "tablet-lg:margin-bottom-0",
];

type SearchResultsControlsProps = {
  sortby: string | null;
  page: number;
  totalResults: string;
  totalPages: number;
  query?: string | null;
};

export const SearchResultsControls = ({
  sortby,
  page,
  totalResults,
  totalPages,
  query,
}: SearchResultsControlsProps) => {
  const t = useTranslations("Search");

  return (
    <div
      className="grid-row padding-top-3"
      data-testid="search-results-controls"
    >
      <div className="flex-1">
        <h3 className={gridRowClasses.join(" ")}>
          {t("resultsHeader.message", { count: totalResults })}
        </h3>
        <div className="tablet:display-block display-none">
          <ExportSearchResultsButton />
        </div>
      </div>
      <div className="flex-1 text-right">
        <SearchPagination
          totalPages={totalPages}
          page={page}
          query={query}
          totalResults={totalResults}
          paginationClassName="flex-justify-start tablet:flex-justify-end border-top-0"
        />
        <div className="tablet:display-block display-none">
          <SearchSortBy sortby={sortby} queryTerm={query} />
        </div>
      </div>
    </div>
  );
};
