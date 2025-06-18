"use server";

import { fetchSavedOpportunities } from "src/services/fetch/fetchers/savedOpportunityFetcher";
import { SearchAPIResponse } from "src/types/search/searchRequestTypes";

import { getTranslations } from "next-intl/server";

import SearchResultsListItem from "src/components/search/SearchResultsListItem";
import ServerErrorAlert from "src/components/ServerErrorAlert";

interface ServerPageProps {
  searchResults: SearchAPIResponse;
  page: number;
}

const NoResults = async () => {
  const t = await getTranslations("Search.resultsListFetch");
  return (
    <div>
      <h2>{t("noResultsTitle")}</h2>
      <ul>
        <li>{t("noResultsBody.0")}</li>
        <li>{t("noResultsBody.1")}</li>
        <li>{t("noResultsBody.2")}</li>
        <li>{t("noResultsBody.3")}</li>
      </ul>
    </div>
  );
};

export default async function SearchResultsList({
  searchResults,
  page,
}: ServerPageProps) {
  const t = await getTranslations("Search");
  const savedOpportunities = await fetchSavedOpportunities();
  const savedOpportunityIds = savedOpportunities.map(
    (opportunity) => opportunity.opportunity_id,
  );
  if (searchResults.status_code !== 200) {
    return <ServerErrorAlert callToAction={t("genericErrorCta")} />;
  }

  if (searchResults.data.length === 0) {
    return <NoResults />;
  }

  return (
    <ul className="usa-list--unstyled">
      {searchResults.data.map((opportunity, index) => (
        <li key={opportunity?.opportunity_id}>
          <SearchResultsListItem
            opportunity={opportunity}
            saved={savedOpportunityIds.includes(opportunity?.opportunity_id)}
            index={index}
            page={page}
          />
        </li>
      ))}
    </ul>
  );
}
