import clsx from "clsx";
import { Metadata } from "next";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";
import { fetchSavedOpportunities } from "src/services/fetch/fetchers/savedOpportunityFetcher";
import { LocalizedPageProps } from "src/types/intl";
import { SearchResponseData } from "src/types/search/searchResponseTypes";

import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button, GridContainer } from "@trussworks/react-uswds";

import SearchResultsListItem from "src/components/search/SearchResultsListItem";
import { USWDSIcon } from "src/components/USWDSIcon";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("SavedGrants.title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

const SavedOpportunitiesList = ({
  opportunities,
}: {
  opportunities: SearchResponseData;
}) => {
  return (
    <ul className="usa-prose usa-list--unstyled">
      {opportunities.map((opportunity) => (
        <>
          {opportunity && (
            <li key={opportunity.opportunity_id}>
              <SearchResultsListItem opportunity={opportunity} saved={true} />
            </li>
          )}
        </>
      ))}
    </ul>
  );
};

const NoSavedOpportunities = ({
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
        className="text-primary-vivid grid-col-1 usa-icon usa-icon--size-6 margin-top-4"
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

export default async function SavedGrants({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const savedOpportunities = await fetchSavedOpportunities();
  const opportunityPromises = savedOpportunities.map(
    async (savedOpportunity) => {
      const { data: opportunityData } = await getOpportunityDetails(
        String(savedOpportunity.opportunity_id),
      );
      return opportunityData;
    },
  );
  const resolvedOpportunities = await Promise.all(opportunityPromises);

  return (
    <>
      <GridContainer>
        <h1 className="tablet-lg:font-sans-xl desktop-lg:font-sans-2xl margin-top-0">
          {t("SavedGrants.heading")}
        </h1>
      </GridContainer>
      <div
        className={clsx({
          "bg-base-lightest": resolvedOpportunities.length === 0,
        })}
      >
        <div className="grid-container padding-y-5 display-flex">
          {resolvedOpportunities.length > 0 ? (
            <SavedOpportunitiesList opportunities={resolvedOpportunities} />
          ) : (
            <NoSavedOpportunities
              noSavedCTA={t.rich("SavedGrants.noSavedCTA", {
                br: () => (
                  <>
                    <br />
                    <br />
                  </>
                ),
              })}
              searchButtonText={t("SavedGrants.searchButton")}
            />
          )}
        </div>
      </div>
    </>
  );
}
