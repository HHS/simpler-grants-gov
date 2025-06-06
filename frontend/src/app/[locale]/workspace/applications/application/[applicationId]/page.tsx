import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/error/page";
import NotFound from "src/app/[locale]/not-found";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getApplicationDetails } from "src/services/fetch/fetchers/applicationFetcher";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";
import { FormDetail } from "src/types/formResponseTypes";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import Link from "next/link";
import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import { OpportunityCard } from "src/components/application/OpportunityCard";
import BetaAlert from "src/components/BetaAlert";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  const meta: Metadata = {
    title: `Application landing page`,
  };
  return meta;
}

interface ApplicationLandingPageProps {
  params: Promise<{ applicationId: string; locale: string }>;
}

const FormLinks = ({
  forms,
  applicationId,
}: {
  forms: [{ form: FormDetail }];
  applicationId: string;
}) => {
  if (forms.length > 0) {
    return (
      <ul className="usa-list">
        {forms.map((form) => {
          return (
            <li key={form.form.form_name}>
              <Link
                href={`/workspace/applications/application/${applicationId}/form/${form.form.form_id}`}
              >
                {form.form.form_name}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }
};

async function ApplicationLandingPage({ params }: ApplicationLandingPageProps) {
  const userSession = await getSession();
  if (!userSession || !userSession.token) {
    return <TopLevelError />;
  }
  const { applicationId } = await params;
  let forms = [];
  let opportunity = {} as OpportunityDetail;

  try {
    const response = await getApplicationDetails(
      applicationId,
      userSession?.token,
    );

    if (response.status_code !== 200) {
      console.error(
        `Error retrieving application details for (${applicationId})`,
        response,
      );
      return <TopLevelError />;
    }
    forms = response.data.competition.competition_forms;
    const opportunityId = response.data.competition.opportunity_id;
    const opportunityResponse = await getOpportunityDetails(
      String(opportunityId),
    );
    if (opportunityResponse.status_code !== 200) {
      console.error(
        `Error retrieving opportunity details for (${opportunityId})`,
        response,
      );
      return <TopLevelError />;
    }
    opportunity = opportunityResponse.data;
  } catch (e) {
    if (parseErrorStatus(e as ApiRequestError) === 404) {
      console.error(
        `Error retrieving application details for application (${applicationId})`,
        e,
      );
      return <NotFound />;
    }
    return <TopLevelError />;
  }

  return (
    <>
      <BetaAlert containerClasses="margin-top-5" />
      <GridContainer>
        <h1>Application</h1>
        <OpportunityCard opportunityOverview={opportunity} />
        <legend className="usa-legend">
          The following is a list of available forms.
        </legend>
        <FormLinks forms={forms} applicationId={applicationId} />
      </GridContainer>
    </>
  );
}

export default withFeatureFlag<ApplicationLandingPageProps, never>(
  ApplicationLandingPage,
  "applyFormPrototypeOff",
  () => redirect("/maintenance"),
);
