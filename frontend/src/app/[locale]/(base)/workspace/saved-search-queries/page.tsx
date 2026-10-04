import { performAgencySearch } from "src/services/fetch/fetchers/agenciesFetcher";
import { fetchSavedSearchesPage } from "src/services/fetch/fetchers/savedSearchFetcher";
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
import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/core/Breadcrumbs";
import GeneralErrorAlert from "src/components/core/GeneralErrorAlert";
import OpportunitiesPagination from "src/app/[locale]/(base)/grantor/opportunities/_components/OpportunitiesPagination";
import { USWDSIcon } from "src/components/core/USWDSIcon";
import { SavedSearchesList } from "./_components/SavedSearchesList";

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

type SavedSearchQueriesProps = LocalizedPageProps & {
  searchParams?: Promise<{ page?: string }>;
};

export default async function SavedSearchQueries({
  params,
  searchParams,
}: SavedSearchQueriesProps) {
  const { locale } = await params;
  const { page: pageParam } = searchParams ? await searchParams : {};
  const parsedPage = Number(pageParam);
  const currentPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const t = await getTranslations({ locale, namespace: "SavedSearches" });
  let savedSearches;
  let totalPages = 0;
  let agencyOptions: FilterOption[] = [];

  const paramDisplayMapping = validSearchQueryParamKeys.reduce(
    (mapping, key) => {
      mapping[key] = t(`parameterNames.${key}`);
      return mapping;
    },
    {} as { [key in ValidSearchQueryParam]: string },
  );

  try {
    const savedSearchPage = await fetchSavedSearchesPage(currentPage);
    savedSearches = savedSearchPage.savedSearches;
    totalPages = savedSearchPage.paginationInfo.total_pages;
  } catch (_e) {
    return (
      <>
        <GridContainer>
          <h1 className="margin-top-0">{t("heading")}</h1>
        </GridContainer>
        <GeneralErrorAlert callToAction={t("error")} />
      </>
    );
  }

  // A page past the end (for example after deleting the last search on the final
  // page, which refreshes in place) would otherwise show the "no saved searches"
  // state even though earlier pages still have searches; send the user to the last page.
  if (
    savedSearches.length === 0 &&
    totalPages > 0 &&
    currentPage > totalPages
  ) {
    redirect(`/workspace/saved-search-queries?page=${totalPages}`);
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
        <Breadcrumbs
          breadcrumbList={[
            {
              title: t("breadcrumbWorkspace"),
              path: `/workspace`,
            },
            {
              title: t("breadcrumbSavedQueries"),
            },
          ]}
        />
        <h1 className="margin-top-0">{t("heading")}</h1>
      </GridContainer>
      <div className="padding-y-5">
        {savedSearches.length > 0 ? (
          <>
            {totalPages > 1 && (
              <div className="grid-container display-flex flex-justify-end margin-bottom-2">
                <OpportunitiesPagination totalPages={totalPages} />
              </div>
            )}
            <SavedSearchesList
              savedSearches={formattedSavedSearches}
              paramDisplayMapping={paramDisplayMapping}
              editText={t("edit")}
              deleteText={t("delete")}
              agencyOptions={agencyOptions}
            />
            {totalPages > 1 && (
              <div className="grid-container display-flex flex-justify-end margin-top-2">
                <OpportunitiesPagination totalPages={totalPages} />
              </div>
            )}
          </>
        ) : (
          <NoSavedSearches />
        )}
      </div>
    </>
  );
}
