import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/(base)/error/page";
import NotFound from "src/app/[locale]/(base)/not-found";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import {
  getApplicationDetails,
  getApplicationHistory,
  getApplicationSubmissions,
} from "src/services/fetch/fetchers/applicationFetcher";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";
import { ApplicationSubmissionsRequestBody } from "src/types/application/applicationSubmissionRequestTypes";
import { ApplicationSubmission } from "src/types/application/applicationSubmissionTypes";
import {
  ApplicationSubmissionsApiResponse,
  Status,
} from "src/types/applicationResponseTypes";
import { Attachment } from "src/types/attachmentTypes";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import ApplicationContainer from "src/components/application/ApplicationContainer";
import { ApplicationHistoryCardProps } from "src/components/application/ApplicationHistoryTable";
import { ApplicationDetailsCardProps } from "src/components/application/InformationCard";

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
  const t = await getTranslations("Application");

  if (!userSession || !userSession.token) {
    return <TopLevelError />;
  }
  const { applicationId } = await params;
  let details = {} as ApplicationDetailsCardProps;
  let historyDetails = [] as ApplicationHistoryCardProps;
  let opportunity = {} as OpportunityDetail;
  let attachments = [] as Attachment[];

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
    details = response.data;
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
    attachments = response.data.application_attachments;
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
  try {
    const historyResponse = await getApplicationHistory(
      applicationId,
      userSession?.token,
    );
    if (historyResponse.status_code !== 200) {
      console.error(
        `Error retrieving application history details for (${applicationId})`,
        historyResponse,
      );
    } else {
      historyDetails = historyResponse.data;
    }
  } catch (e) {
    console.error(
      `Error retrieving application history details for (${applicationId})`,
      e,
    );
  }

  const latestApplicationSubmission = await getLatestSubmission(
    userSession?.token,
    applicationId,
    details.application_status,
  );

  return (
    <>
      <GridContainer>
        <h1 className="margin-top-9 margin-bottom-7">{t("title")}</h1>
        <ApplicationContainer
          applicationDetails={details}
          opportunity={opportunity}
          attachments={attachments}
          applicationHistory={historyDetails}
          latestApplicationSubmission={latestApplicationSubmission}
        />
      </GridContainer>
    </>
  );
}

const LATEST_APPLICATION_SUBMISSION_REQUEST: ApplicationSubmissionsRequestBody =
  {
    pagination: {
      page_offset: 1,
      page_size: 1,
      sort_order: [{ order_by: "created_at", sort_direction: "descending" }],
    },
  };

export async function getLatestSubmission(
  token: string,
  applicationId: string,
  applicationStatus: string,
): Promise<ApplicationSubmission | null> {
  // Submissions are only available if the application is in the ACCEPTED status.
  if (applicationStatus !== Status.ACCEPTED) return null;

  let submissionsResponse: ApplicationSubmissionsApiResponse | null = null;
  try {
    submissionsResponse = await getApplicationSubmissions(
      applicationId,
      token,
      LATEST_APPLICATION_SUBMISSION_REQUEST,
    );
    if (submissionsResponse.data.length !== 1) {
      console.error(
        `Expected 1 application submission but received ${submissionsResponse.data.length}`,
      );
      return null;
    }
    return submissionsResponse.data[0];
  } catch (e) {
    console.error(
      `Error retrieving application submission for (${applicationId})`,
    );
  }
  return null;
}

export default withFeatureFlag<ApplicationLandingPageProps, never>(
  ApplicationLandingPage,
  "applyFormPrototypeOff",
  () => redirect("/maintenance"),
);
