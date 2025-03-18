import clsx from "clsx";
import { omit } from "lodash";
import { Metadata } from "next";
import { getSession } from "src/services/auth/session";
import { fetchSavedSearches } from "src/services/fetch/fetchers/savedSearchFetcher";
import { LocalizedPageProps } from "src/types/intl";
import { ValidSearchQueryParamData } from "src/types/search/searchRequestTypes";
import {
  ValidSearchQueryParam,
  validSearchQueryParamKeys,
} from "src/types/search/searchResponseTypes";
import { queryParamsToQueryString } from "src/utils/generalUtils";
import { searchToQueryParams } from "src/utils/search/searchFormatUtils";

import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, GridContainer } from "@trussworks/react-uswds";

import ServerErrorAlert from "src/components/ServerErrorAlert";
import { USWDSIcon } from "src/components/USWDSIcon";
import { DeleteSavedSearchModal } from "src/components/workspace/DeleteSavedSearchModal";
import { EditSavedSearchModal } from "src/components/workspace/EditSavedSearchModal";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("SavedSearches.title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

const SavedSearchesList = ({
  savedSearches,
  paramDisplayMapping,
  editText,
  deleteText,
}: {
  savedSearches: {
    name: string;
    id: string;
    searchParams: ValidSearchQueryParamData;
  }[];
  paramDisplayMapping: { [key in ValidSearchQueryParam]: string };
  editText: string;
  deleteText: string;
}) => {
  return (
    <ul className="usa-prose usa-list--unstyled grid-container">
      {savedSearches.map((savedSearch) => (
        <li key={savedSearch.id}>
          <div className="border-1px border-base-lighter padding-x-2 padding-y-105 margin-bottom-2 text-base-darker">
            <div className="grid-row grid-gap">
              <div className="desktop:grid-col-fill">
                <div className="grid-row padding-right-2">
                  <div className="tablet:grid-col-8 grid-col-6">
                    <h2 className="margin-y-105 line-height-sans-2">
                      <Link
                        href={`/search${queryParamsToQueryString(savedSearch.searchParams)}savedSearch=${savedSearch.id}`}
                        className="margin-right-05"
                      >
                        {savedSearch.name}
                      </Link>
                      <USWDSIcon name="search" />
                    </h2>
                  </div>
                  <div className="grid-col margin-top-2 text-right">
                    <div className="grid-row">
                      <div className="grid-col">
                        <EditSavedSearchModal
                          savedSearchId={savedSearch.id}
                          editText={editText}
                        />
                      </div>
                      <div className="grid-col">
                        <DeleteSavedSearchModal
                          savedSearchId={savedSearch.id}
                          deleteText={deleteText}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid-row flex-column">
                  <div>
                    {Object.entries(omit(paramDisplayMapping, "page")).map(
                      ([key, paramDisplay]) => {
                        const value =
                          savedSearch.searchParams[
                            key as ValidSearchQueryParam
                          ];
                        return value ? (
                          <div key={key}>
                            <span className="text-bold">{paramDisplay}: </span>
                            <span>{value.replaceAll(",", ", ")}</span>
                          </div>
                        ) : null;
                      },
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

const NoSavedSearches = ({
  noSavedCTA,
  searchButtonText,
}: {
  noSavedCTA: React.ReactNode;
  searchButtonText: string;
}) => {
  return (
    <>
      <USWDSIcon
        name="star_outline"
        className="grid-col-1 usa-icon usa-icon--size-6 margin-top-4"
      />
      <div className="margin-top-2 grid-col-11">
        <p className="usa-intro ">{noSavedCTA}</p>{" "}
        <Link href="/search">
          <Button type="button">{searchButtonText}</Button>
        </Link>
      </div>
    </>
  );
};

export default async function SavedSearchQueries({
  params,
}: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SavedSearches" });
  const session = await getSession();
  let savedSearches;

  const paramDisplayMapping = validSearchQueryParamKeys.reduce(
    (mapping, key) => {
      mapping[key] = t(`parameterNames.${key}`);
      return mapping;
    },
    {} as { [key in ValidSearchQueryParam]: string },
  );

  if (!session || !session.token) {
    redirect("/unauthorized");
  }

  try {
    savedSearches = await fetchSavedSearches(session.token, session.user_id);
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
