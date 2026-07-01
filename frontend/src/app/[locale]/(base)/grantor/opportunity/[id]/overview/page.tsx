import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOpportunityForGrantor } from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";
import {
  GrantorOpportunityDetail,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Link } from "@trussworks/react-uswds";

import { UnauthorizedMessage } from "src/components/core/UnauthorizedMessage";
import { OpportunityDetailsHeader } from "src/components/grantor-opportunities/OpportunityDetailsHeader";
import { ProgressChecker } from "src/components/grantor-opportunities/ProgressChecker";
import {
  competitionRequiredFields,
  summaryRequiredFields,
} from "./RequiredFields";

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
};

async function OpportunityOverviewPage({ params }: PageProps) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "OpportunityOverview" });
  let opportunityData: GrantorOpportunityDetail;
  try {
    const response = await getOpportunityForGrantor(id);
    opportunityData = response.data;
  } catch (error) {
    const status = parseErrorStatus(error as ApiRequestError);
    if (status === 404) {
      notFound();
    }
    if (status === 403) {
      return <UnauthorizedMessage />;
    }
    throw error;
  }
  const editUrl = "../" + id + "/edit";
  const competitionUrl = "../" + id + "/competition";
  const summary: Summary = opportunityData.summary;
  let competition = {};
  if (opportunityData.competitions && opportunityData.competitions.length > 0) {
    // For now, use the first competition
    competition = opportunityData.competitions[0];
  }

  return (
    <div className="bg-white">
      <OpportunityDetailsHeader
        opportunityData={opportunityData}
        locale={locale}
      />
      <div className="grid-container padding-top-4 padding-bottom-4">
        <div className="grid-row grid-gap-2 padding-top-2">
          <div className="tablet:grid-col">
            <Link href={editUrl}>{t("labels.editOpportunityLink")}</Link>
          </div>
          <div className="tablet:grid-col">
            <ProgressChecker
              requiredFields={summaryRequiredFields}
              dataToCheck={summary}
            />
          </div>
        </div>
        <hr />
        <div className="grid-row grid-gap-2 padding-top-2">
          <div className="tablet:grid-col">
            <Link href={competitionUrl}>{t("labels.competitionLink")}</Link>
          </div>
          <div className="tablet:grid-col">
            <ProgressChecker
              requiredFields={competitionRequiredFields}
              dataToCheck={competition}
            />{" "}
          </div>
        </div>
        <hr />
      </div>
    </div>
  );
}

export default withFeatureFlag<PageProps, never>(
  OpportunityOverviewPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
