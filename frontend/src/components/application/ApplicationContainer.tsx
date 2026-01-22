"use client";

import { useUser } from "src/services/auth/useUser";
import { submitApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";
import {
  ApplicationDetail,
  ApplicationHistory,
  Status,
} from "src/types/applicationResponseTypes";
import { Attachment } from "src/types/attachmentTypes";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Alert,
  SummaryBox,
  SummaryBoxContent,
  SummaryBoxHeading,
} from "@trussworks/react-uswds";

import { FormValidationWarning } from "src/components/applyForm/types";
import { ApplicationFormsTable } from "./ApplicationFormsTable";
import { ApplicationHistoryTable } from "./ApplicationHistoryTable";
import ApplicationValidationAlert from "./ApplicationValidationAlert";
import { AttachmentsCard } from "./attachments/AttachmentsCard";
import { InformationCard } from "./InformationCard";
import { OpportunityCard } from "./OpportunityCard";

const MY_APPLICATIONS_LINK = "/applications";

const ApplicationContainer = ({
  applicationDetails,
  attachments,
  opportunity,
  applicationHistory,
}: {
  applicationDetails: ApplicationDetail;
  attachments: Attachment[];
  opportunity: OpportunityDetail;
  applicationHistory: ApplicationHistory[];
}) => {
  const forms = applicationDetails.competition.competition_forms;
  const applicationForms = applicationDetails.application_forms;
  const applicationId = applicationDetails.application_id;
  const applicationStatus = applicationDetails.application_status;
  const applicationDetailsObject = applicationDetails;

  const { user } = useUser();
  const token = user?.token || null;
  const t = useTranslations("Application");
  const router = useRouter();

  const [validationErrors, setValidationErrors] = useState<
    FormValidationWarning[]
  >([]);

  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const instructionsDownloadPath = applicationDetails.competition
    .competition_instructions.length
    ? applicationDetails.competition.competition_instructions[0].download_path
    : "";
  const handleSubmit = useCallback(() => {
    if (!token) {
      return;
    }

    setLoading(true);
    submitApplication(applicationId)
      .then((data) => {
        if (!data) {
          setError(true);
        } else if (data?.errors) {
          setValidationErrors(data.errors);
          router.refresh();
        } else {
          setSuccess(true);
          // Refresh server-side data to get updated application status from API
          router.refresh();
        }
      })
      .catch((error) => {
        setError(true);
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [applicationId, token, router]);

  return (
    <>
      {(success ||
        applicationDetails.application_status === Status.SUBMITTED ||
        applicationDetails.application_status === Status.ACCEPTED) && (
        <SummaryBox>
          <SummaryBoxHeading headingLevel="h3">
            {t("submissionSuccess.title")}
          </SummaryBoxHeading>
          <SummaryBoxContent
            style={{ fontWeight: "bold", paddingBottom: "20px" }}
          >
            Application ID #: {applicationId}
          </SummaryBoxContent>
          <SummaryBoxContent style={{ paddingBottom: "20px" }}>
            {t.rich("submissionSuccess.description", {
              linkMyApplications: (chunks) => (
                <Link href={MY_APPLICATIONS_LINK}>{chunks}</Link>
              ),
              p: (content) => (
                <p style={{ width: "100%", maxWidth: "100%" }}>{content}</p>
              ),
            })}
          </SummaryBoxContent>
          <SummaryBoxContent>
            {t.rich("submissionSuccess.contact", {
              "email-link": (content) => (
                <a href="mailto:simpler@grants.gov">{content}</a>
              ),
            })}
          </SummaryBoxContent>
        </SummaryBox>
      )}
      {error && (
        <Alert
          heading={t("submissionError.title")}
          headingLevel="h3"
          type="error"
          validation
        >
          {t.rich("submissionError.description", {
            "email-link": (content) => (
              <a href="mailto:simpler@grants.gov">{content}</a>
            ),
            p: (content) => <p>{content}</p>,
          })}
        </Alert>
      )}
      {validationErrors.length > 0 &&
        applicationDetails.application_status === "in_progress" &&
        !success && (
          <ApplicationValidationAlert
            applicationForms={applicationForms}
            forms={forms}
            validationErrors={validationErrors}
          />
        )}
      <InformationCard
        applicationDetails={applicationDetails}
        applicationSubmitHandler={handleSubmit}
        applicationSubmitted={
          applicationStatus === "submitted" ||
          applicationStatus === "accepted" ||
          success
        }
        submissionLoading={loading}
        opportunityName={opportunity.opportunity_title}
        instructionsDownloadPath={instructionsDownloadPath}
      />
      <OpportunityCard opportunityOverview={opportunity} />
      <ApplicationFormsTable
        applicationForms={applicationForms}
        competitionInstructionsDownloadPath={instructionsDownloadPath}
        errors={validationErrors}
        applicationDetailsObject={applicationDetailsObject}
      />
      <AttachmentsCard
        applicationId={applicationId}
        attachments={attachments}
        competitionInstructionsDownloadPath={instructionsDownloadPath}
      />
      <ApplicationHistoryTable applicationHistory={applicationHistory} />
    </>
  );
};

export default ApplicationContainer;
