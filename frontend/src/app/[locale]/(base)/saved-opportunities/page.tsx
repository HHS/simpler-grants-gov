import { SAVED_OPPORTUNITIES_CRUMBS } from "src/constants/breadcrumbs";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";
import { fetchSavedOpportunities } from "src/services/fetch/fetchers/savedOpportunityFetcher";
import { LocalizedPageProps } from "src/types/intl";
import { SearchResponseData } from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import SearchResultsListItem from "src/components/search/SearchResultsListItem";
import { USWDSIcon } from "src/components/USWDSIcon";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NoSavedOpportunities = () => {
  const t = useTranslations("SavedOpportunities");
  return (
    <>
      <USWDSIcon
        name="star_outline"
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
    </>
  );
};

const SavedOpportunitiesList = ({
  opportunities,
}: {
  opportunities: SearchResponseData;
}) => {
  const savedOpportunitiesListItems = opportunities.map(
    (opportunity, index) =>
      opportunity && (
        <li key={opportunity.opportunity_id}>
          <SearchResultsListItem
            opportunity={opportunity}
            saved={true}
            index={index}
          />
        </li>
      ),
  );
  return <ul className="usa-list--unstyled">{savedOpportunitiesListItems}</ul>;
};

export default async function SavedOpportunities({
  params,
}: LocalizedPageProps) {
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
        <Breadcrumbs breadcrumbList={SAVED_OPPORTUNITIES_CRUMBS} />
        <h1 className="margin-top-0">{t("SavedOpportunities.heading")}</h1>
      </GridContainer>
      <div className="grid-container padding-y-5 display-flex">
        {resolvedOpportunities.length > 0 ? (
          <SavedOpportunitiesList opportunities={resolvedOpportunities} />
        ) : (
          <NoSavedOpportunities />
        )}
      </div>
    </>
  );
}
