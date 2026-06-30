import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOpportunityForGrantor } from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";
import { GrantorOpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Link } from "@trussworks/react-uswds";

import { UnauthorizedMessage } from "src/components/core/UnauthorizedMessage";
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
  const editUrl = "../" + id + "/edit";
  const competitionUrl = "../" + id + "/competition";

  // Get the opportunity detailed data in order to calculate the statuses
  let opportunityData = {} as GrantorOpportunityDetail;
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

  return (
    <div className="bg-white">
      {/* PLACEHOLDER: header here */}
      <div className="grid-container padding-top-4 padding-bottom-4">
        <div className="grid-row grid-gap-2 padding-top-2">
          <div className="tablet:grid-col">
            <Link href={editUrl}>{t("labels.editOpportunityLink")}</Link>
          </div>
          <div className="tablet:grid-col">
            {/* PLACEHOLDER: status icon here */}
          </div>
        </div>
        <hr />
        <div className="grid-row grid-gap-2 padding-top-2">
          <div className="tablet:grid-col">
            <Link href={competitionUrl}>{t("labels.competitionLink")}</Link>
          </div>
          <div className="tablet:grid-col">
            {/* PLACEHOLDER: status icon here */}
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
