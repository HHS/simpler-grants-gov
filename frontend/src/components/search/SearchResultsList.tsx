"use server";

import { fetchSavedOpportunities } from "src/services/fetch/fetchers/savedOpportunityFetcher";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

import { getTranslations } from "next-intl/server";

import SearchResultsListItem from "src/components/search/SearchResultsListItem";
import ServerErrorAlert from "src/components/ServerErrorAlert";

interface ServerPageProps {
  searchResults: SearchAPIResponse;
}

const fetchSavedOpportunities = async (): Promise<SavedOpportunity[]> => {
  const session = await getSession();
  if (!session || !session.token) {
    return [];
  }
  const savedOpportunities = await getSavedOpportunities(
    session.token,
    session.user_id as string,
  );
  return savedOpportunities;
};

export default async function SearchResultsList({
  searchResults,
}: ServerPageProps) {
  const t = await getTranslations("Search");

  const savedOpportunities = await fetchSavedOpportunities();
  const savedOpportunityIds = savedOpportunities.map(
    (opportunity) => opportunity.opportunity_id,
  );
  if (searchResults.status_code !== 200) {
    return <ServerErrorAlert callToAction={t("generic_error_cta")} />;
  }

  if (searchResults.data.length === 0) {
    return (
      <div>
        <h2>{t("resultsListFetch.noResultsTitle")}</h2>
        <ul>
          <li>{t("resultsListFetch.noResultsBody.0")}</li>
          <li>{t("resultsListFetch.noResultsBody.1")}</li>
          <li>{t("resultsListFetch.noResultsBody.2")}</li>
          <li>{t("resultsListFetch.noResultsBody.3")}</li>
        </ul>
      </div>
    );
  }

  return (
    <ul className="usa-list--unstyled">
      {searchResults.data.map((opportunity) => (
        <li key={opportunity?.opportunity_id}>
          <SearchResultsListItem
            opportunity={opportunity}
            saved={savedOpportunityIds.includes(opportunity?.opportunity_id)}
          />
        </li>
      ))}
    </ul>
  );
}
