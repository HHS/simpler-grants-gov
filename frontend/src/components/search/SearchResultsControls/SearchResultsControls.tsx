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
    <div className="grid-row padding-top-4">
      <div className="flex-1">
        <h3 className={gridRowClasses.join(" ")}>
          {t("resultsHeader.message", { count: totalResults })}
        </h3>
        <ExportSearchResultsButton />
      </div>
      <div className="flex-1 text-right">
        <SearchPagination
          totalPages={totalPages}
          page={page}
          query={query}
          totalResults={totalResults}
          paginationClassName="flex-justify-end"
        />
        <div className="tablet-lg:grid-col-auto">
          <SearchSortBy sortby={sortby} queryTerm={query} />
        </div>
      </div>
    </div>
  );
};
