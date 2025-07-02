import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/error/page";
import NotFound from "src/app/[locale]/not-found";
import { AttachmentsProvider } from "src/context/application/AttachmentsContext";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getApplicationDetails } from "src/services/fetch/fetchers/applicationFetcher";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import { AttachmentsCard } from "src/components/application/attachments/AttachmentsCard";
import {
  ApplicationDetailsCardProps,
  InformationCard,
} from "src/components/application/InformationCard";
import { OpportunityCard } from "src/components/application/OpportunityCard";
import { ApplicationFormsTable } from "src/components/workspace/ApplicationFormsTable";

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

async function ApplicationLandingPage({ params }: ApplicationLandingPageProps) {
  const userSession = await getSession();
  if (!userSession || !userSession.token) {
    return <TopLevelError />;
  }
  const { applicationId } = await params;
  let applicationForms = [];
  let attachments = [];
  let details = {} as ApplicationDetailsCardProps;
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
    applicationForms = response.data.application_forms;
    details = response.data;
    forms = response.data.competition.competition_forms;
    applicationForms = response.data.application_forms;
    attachments = response.data.application_attachments;
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
      <GridContainer>
        <h1>Application</h1>
        <InformationCard applicationDetails={details} />
        <OpportunityCard opportunityOverview={opportunity} />
        <ApplicationFormsTable
          forms={forms}
          applicationForms={applicationForms}
          applicationId={applicationId}
        />
        <AttachmentsProvider
          initialAttachments={attachments}
          applicationId={applicationId}
        >
          <AttachmentsCard />
        </AttachmentsProvider>
      </GridContainer>
    </>
  );
}

export default withFeatureFlag<ApplicationLandingPageProps, never>(
  ApplicationLandingPage,
  "applyFormPrototypeOff",
  () => redirect("/maintenance"),
);
