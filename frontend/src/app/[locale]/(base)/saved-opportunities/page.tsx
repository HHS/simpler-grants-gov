import { getSession } from "src/services/auth/session";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";
import { getUserOrganizations } from "src/services/fetch/fetchers/organizationsFetcher";
import { fetchSavedOpportunities } from "src/services/fetch/fetchers/savedOpportunityFetcher";
import { Organization } from "src/types/applicationResponseTypes";
import { LocalizedPageProps } from "src/types/intl";
import {
  DEFAULT_SAVED_OPPORTUNITY_SCOPE,
  getSavedOpportunitiesScopeOrganizationIds,
  getScopeFromSavedByQueryParam,
  INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE,
} from "src/utils/opportunity/savedOpportunitiesUtils";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { SavedOpportunitiesController } from "src/components/saved-opportunities/SavedOpportunitiesController";
import SavedOpportunityOwnershipFilter from "src/components/saved-opportunities/SavedOpportunityOwnershipFilter";
import SavedOpportunityStatusFilter from "src/components/saved-opportunities/SavedOpportunityStatusFilter";
import { USWDSIcon } from "src/components/USWDSIcon";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NoSavedOpportunities = () => {
  const t = useTranslations("SavedOpportunities");
  return (
    <>
      <USWDSIcon
        name="star_outline"
        className="text-primary-vivid grid-col-1 saved-opportunity-usa-icon usa-icon--size-6 margin-top-4"
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

type SavedOpportunitiesPageProps = LocalizedPageProps & {
  searchParams: Promise<{ status?: string; savedBy?: string }>;
};

export default async function SavedOpportunities({
  params,
  searchParams,
}: SavedOpportunitiesPageProps) {
  const { locale } = await params;
  const { status, savedBy } = await searchParams;
  const t = await getTranslations({ locale });
  const session = await getSession();

  let organizations: Organization[] = [];
  let hasOrganizationsError = false;

  if (session?.token) {
    try {
      organizations = await getUserOrganizations(
        session.token,
        session.user_id,
      );
    } catch (error: unknown) {
      console.error("Unable to fetch user organizations", error);
      hasOrganizationsError = true;
    }
  }

  const savedOpportunitiesScope = getScopeFromSavedByQueryParam(savedBy);
  const organizationIdsFilter = getSavedOpportunitiesScopeOrganizationIds(
    savedOpportunitiesScope,
  );

  const savedOpportunities = await fetchSavedOpportunities(
    savedOpportunitiesScope,
    status,
    organizationIdsFilter,
  );

  // Fetch all saved opportunities separately so we can distinguish:
  // - user has no saved opportunities at all
  // - current filter returns no saved opportunities
  const allSavedOpportunities = await fetchSavedOpportunities(
    DEFAULT_SAVED_OPPORTUNITY_SCOPE,
  );

  // Fetch individually saved opportunities separately so the UI can preserve
  // the Individual tag even when an opportunity is also shared with one or
  // more organizations.
  const individuallySavedOpportunities = await fetchSavedOpportunities(
    INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE,
  );

  const hasFilteredSavedOpportunities = savedOpportunities.length > 0;
  const hasAnySavedOpportunities = allSavedOpportunities.length > 0;

  const opportunityPromises = savedOpportunities.map(
    async (savedOpportunity) => {
      const { data: opportunityData } = await getOpportunityDetails(
        savedOpportunity.opportunity_id,
      );

      return {
        ...opportunityData,
        saved_to_organizations: savedOpportunity.saved_to_organizations ?? [],
      };
    },
  );

  const resolvedOpportunities = await Promise.all(opportunityPromises);

  const individuallySavedOpportunityIds = new Set<string>(
    individuallySavedOpportunities.map((savedOpportunity) =>
      String(savedOpportunity.opportunity_id),
    ),
  );

  return (
    <>
      <GridContainer>
        <Breadcrumbs
          breadcrumbList={[
            {
              title: t("SavedOpportunities.breadcrumbWorkspace"),
              path: `/dashboard`,
            },
            {
              title: t("SavedOpportunities.breadcrumbSavedOpportunities"),
            },
          ]}
        />
        <h1 className="margin-top-0">{t("SavedOpportunities.heading")}</h1>
      </GridContainer>
      <div className="grid-container padding-y-5">
        {hasAnySavedOpportunities ? (
          <>
            <div className="margin-bottom-3 display-flex flex-column tablet:flex-row flex-justify-end tablet:flex-align-end">
              <div className="margin-bottom-2 tablet:margin-bottom-0 tablet:margin-right-2">
                <SavedOpportunityOwnershipFilter
                  organizations={organizations}
                  savedBy={savedBy || null}
                />
              </div>
              <SavedOpportunityStatusFilter status={status || null} />
            </div>

            {hasFilteredSavedOpportunities ? (
              <SavedOpportunitiesController
                opportunities={resolvedOpportunities}
                organizations={organizations}
                individuallySavedOpportunityIds={
                  individuallySavedOpportunityIds
                }
                hasOrganizationsError={hasOrganizationsError}
              />
            ) : (
              <p>{t("SavedOpportunities.noMatchingStatus")}</p>
            )}
          </>
        ) : (
          <div className="display-flex">
            <NoSavedOpportunities />
          </div>
        )}
      </div>
    </>
  );
}
