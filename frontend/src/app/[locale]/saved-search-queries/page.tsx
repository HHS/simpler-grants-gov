import clsx from "clsx";
import { SAVED_SEARCHES_CRUMBS } from "src/constants/breadcrumbs";
import { fetchSavedSearches } from "src/services/fetch/fetchers/savedSearchFetcher";
import { LocalizedPageProps } from "src/types/intl";
import {
  ValidSearchQueryParam,
  validSearchQueryParamKeys,
} from "src/types/search/searchQueryTypes";
import { searchToQueryParams } from "src/utils/search/searchFormatUtils";

import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import ServerErrorAlert from "src/components/ServerErrorAlert";
import { USWDSIcon } from "src/components/USWDSIcon";
import { SavedSearchesList } from "src/components/workspace/SavedSearchesList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NoSavedSearches = ({
  noSavedCTA,
  searchButtonText,
}: {
  noSavedCTA: React.ReactNode;
  searchButtonText: string;
}) => {
  return (
    <div className="grid-container display-flex">
      <USWDSIcon
        name="filter_list"
        className="text-primary-vivid grid-col-1 usa-icon usa-icon--size-6 margin-top-4"
      />
      <div className="margin-top-2 grid-col-11">
        <p className="usa-intro ">{noSavedCTA}</p>
        <Link href="/search">
          <Button type="button">{searchButtonText}</Button>
        </Link>
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
          <h1 className="tablet-lg:font-sans-xl desktop-lg:font-sans-2xl margin-top-0">
            {t("heading")}
          </h1>
        </GridContainer>
        <ServerErrorAlert callToAction={t("error")} />
      </>
    );
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
        <h1 className="tablet-lg:font-sans-xl desktop-lg:font-sans-2xl margin-top-0">
          {t("heading")}
        </h1>
      </GridContainer>
      <div
        className={clsx({
          "bg-base-lightest": savedSearches.length === 0,
        })}
      >
        <div className="padding-y-5">
          {savedSearches.length > 0 ? (
            <SavedSearchesList
              savedSearches={formattedSavedSearches}
              paramDisplayMapping={paramDisplayMapping}
              editText={t("edit")}
              deleteText={t("delete")}
            />
          ) : (
            <NoSavedSearches
              noSavedCTA={t.rich("noSavedCTA", {
                br: () => (
                  <>
                    <br />
                    <br />
                  </>
                ),
              })}
              searchButtonText={t("searchButton")}
            />
          )}
        </div>
      </div>
    </>
  );
}
