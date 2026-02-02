import { SAVED_SEARCHES_CRUMBS } from "src/constants/breadcrumbs";
import { performAgencySearch } from "src/services/fetch/fetchers/agenciesFetcher";
import { fetchSavedSearches } from "src/services/fetch/fetchers/savedSearchFetcher";
import { LocalizedPageProps } from "src/types/intl";
import { FilterOption } from "src/types/search/searchFilterTypes";
import {
  ValidSearchQueryParam,
  validSearchQueryParamKeys,
} from "src/types/search/searchQueryTypes";
import { agencyToFilterOption } from "src/utils/search/filterUtils";
import { searchToQueryParams } from "src/utils/search/searchFormatUtils";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import ServerErrorAlert from "src/components/ServerErrorAlert";
import { USWDSIcon } from "src/components/USWDSIcon";
import { SavedSearchesList } from "src/components/workspace/SavedSearchesList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NoSavedSearches = () => {
  const t = useTranslations("SavedSearches");
  return (
    <div className="grid-container display-flex">
      <USWDSIcon
        name="filter_list"
        className="text-primary-vivid grid-col-1 usa-icon usa-icon--size-6 margin-top-4"
      />
      <div className="margin-top-2 grid-col-11">
        <p>{t("noSavedCTAParagraphOne")}</p>
        <p>{t("noSavedCTAParagraphTwo")}</p>
        <p>
          <Link href="/search" className="usa-button">
            {t("searchButton")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default async function SavedSearchQueries({
  params,
}: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SavedSearches" });
  let savedSearches;
  let agencyOptions: FilterOption[] = [];

  const paramDisplayMapping = validSearchQueryParamKeys.reduce(
    (mapping, key) => {
      mapping[key] = t(`parameterNames.${key}`);
      return mapping;
    },
    {} as { [key in ValidSearchQueryParam]: string },
  );

  try {
    savedSearches = await fetchSavedSearches();
  } catch (e) {
    return (
      <>
        <GridContainer>
          <h1 className="margin-top-0">{t("heading")}</h1>
        </GridContainer>
        <ServerErrorAlert callToAction={t("error")} />
      </>
    );
  }

  try {
    const agencies = await performAgencySearch();
    agencyOptions = agencies.map(agencyToFilterOption);
  } catch (e) {
    console.error("Unable to fetch agencies list for saved search display", e);
  }

  const formattedSavedSearches = savedSearches.map((search) => ({
    searchParams: searchToQueryParams(search.search_query),
    name: search.name,
    id: search.saved_search_id,
  }));

  return (
    <>
      <GridContainer>
        <Breadcrumbs breadcrumbList={SAVED_SEARCHES_CRUMBS} />
        <h1 className="margin-top-0">{t("heading")}</h1>
      </GridContainer>
      <div className="padding-y-5">
        {savedSearches.length > 0 ? (
          <SavedSearchesList
            savedSearches={formattedSavedSearches}
            paramDisplayMapping={paramDisplayMapping}
            editText={t("edit")}
            deleteText={t("delete")}
            agencyOptions={agencyOptions}
          />
        ) : (
          <NoSavedSearches />
        )}
      </div>
    </>
  );
}
