"use client";

import { useUser } from "src/services/auth/useUser";
import { submitApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";
import { ApplicationDetail } from "src/types/applicationResponseTypes";
import { Attachment } from "src/types/attachmentTypes";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Alert } from "@trussworks/react-uswds";

import { FormValidationWarning } from "src/components/applyForm/types";
import { ApplicationFormsTable } from "./ApplicationFormsTable";
import ApplicationValidationAlert from "./ApplicationValidationAlert";
import { AttachmentsCard } from "./attachments/AttachmentsCard";
import { InformationCard } from "./InformationCard";
import { OpportunityCard } from "./OpportunityCard";

const ApplicationContainer = ({
  applicationDetails,
  attachments,
  opportunity,
}: {
  applicationDetails: ApplicationDetail;
  attachments: Attachment[];
  opportunity: OpportunityDetail;
}) => {
  const forms = applicationDetails.competition.competition_forms;
  const applicationForms = applicationDetails.application_forms;
  const applicationId = applicationDetails.application_id;
  const applicationStatus = applicationDetails.application_status;

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

  // TODO: check this after mvp
  // instructions were to use the first available path
  // this may change
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
      {success && (
        <Alert
          heading={t("submissionSuccess.title")}
          headingLevel="h3"
          type="success"
        >
          {t("submissionSuccess.description")}{" "}
        </Alert>
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

      <ApplicationValidationAlert
        applicationForms={applicationForms}
        forms={forms}
        validationErrors={validationErrors}
      />
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
        applicationId={applicationId}
        forms={forms}
        errors={validationErrors}
        competitionInstructionsDownloadPath={instructionsDownloadPath}
      />
      <AttachmentsCard
        applicationId={applicationId}
        attachments={attachments}
        competitionInstructionsDownloadPath={instructionsDownloadPath}
      />
    </>
  );
};

export default ApplicationContainer;
