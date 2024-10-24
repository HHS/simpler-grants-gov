import fetchers from "src/app/api/Fetchers";
import { QueryParamData } from "src/services/search/searchfetcher/SearchFetcher";

import { getTranslations } from "next-intl/server";

import SearchErrorAlert from "src/components/search/error/SearchErrorAlert";
import SearchResultsListItem from "src/components/search/SearchResultsListItem";

interface ServerPageProps {
  searchParams: QueryParamData;
}

export default async function SearchResultsListFetch({
  searchParams,
}: ServerPageProps) {
  const searchResults =
    await fetchers.searchOpportunityFetcher.searchOpportunities(searchParams);
  const maxPaginationError = null;
  const t = await getTranslations("Search");

  if (searchResults.status_code !== 200) {
    return <SearchErrorAlert />;
  }

  if (searchResults.data.length === 0) {
    return (
      <div>
        <h2>{t("resultsListFetch.title")}</h2>
        <ul>
          {t.rich("resultsListFetch.body", {
            li: (chunks) => <li>{chunks}</li>,
          })}
        </ul>
      </div>
    );
  }

  return (
    <ul className="usa-list--unstyled">
      {/* TODO #1485: show proper USWDS error  */}
      {maxPaginationError && <h4>{t("resultsListFetch.paginationError")}</h4>}
      {searchResults.data.map((opportunity) => (
        <li key={opportunity?.opportunity_id}>
          <SearchResultsListItem opportunity={opportunity} />
        </li>
      ))}
    </ul>
  );
}
