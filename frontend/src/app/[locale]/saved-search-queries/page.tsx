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

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("SavedGrants.title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

const SavedSearchesList = ({
  savedSearches,
  paramDisplayMapping,
}: {
  savedSearches: {
    name: string;
    id: string;
    searchParams: ValidSearchQueryParamData;
  }[];
  paramDisplayMapping: { [key in ValidSearchQueryParam]: string };
}) => {
  return (
    <ul className="usa-prose usa-list--unstyled">
      {savedSearches.map((savedSearch) => (
        <li key={savedSearch.id}>
          <Link
            href={`/search${queryParamsToQueryString(savedSearch.searchParams)}`}
          >
            {savedSearch.name}
          </Link>
          {Object.entries(omit(paramDisplayMapping, "page")).map(
            ([key, paramDisplay]) => {
              const value =
                savedSearch.searchParams[key as ValidSearchQueryParam];
              return value ? (
                <div key={key}>
                  <span>{paramDisplay}:</span>
                  <span>
                    {savedSearch.searchParams[key as ValidSearchQueryParam]}
                  </span>
                </div>
              ) : null;
            },
          )}
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
        <div className="grid-container padding-y-5 display-flex">
          {savedSearches.length > 0 ? (
            <SavedSearchesList
              savedSearches={formattedSavedSearches}
              paramDisplayMapping={paramDisplayMapping}
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
