"use client";

import { useUser } from "src/services/auth/useUser";
import { submitApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";
import {
  ApplicationDetail,
  ApplicationFormDetail,
  FormValidationWarnings,
} from "src/types/applicationResponseTypes";
import { CompetitionForms } from "src/types/competitionsResponseTypes";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Alert } from "@trussworks/react-uswds";

import { ApplicationFormsTable } from "./ApplicationFormsTable";
import { InformationCard } from "./InformationCard";
import { OpportunityCard } from "./OpportunityCard";

const ApplicationContainer = ({
  applicationDetails,
  opportunity,
}: {
  applicationDetails: ApplicationDetail;
  opportunity: OpportunityDetail;
}) => {
  const forms = applicationDetails.competition.competition_forms;
  const applicationForms = applicationDetails.application_forms;
  const applicationId = applicationDetails.application_id;
  const applicationStatus = applicationDetails.application_status;

  const { user } = useUser();
  const token = user?.token || null;
  const t = useTranslations("Application");

  const [validationErrors, setValidationErrors] =
    useState<FormValidationWarnings>();

  const [error, setError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = useCallback(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    submitApplication(applicationId)
      .then((data) => {
        if (
          data?.form_validation_errors &&
          Object.entries(data.form_validation_errors).length > 0
        ) {
          setValidationErrors(data.form_validation_errors);
        } else {
          setSuccess(true);
        }
      })
      .catch((error) => {
        setError(true);
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [applicationId, token]);

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

      {validationErrors && (
        <ApplicantionValidationAlert
          applicationForms={applicationForms}
          forms={forms}
          validationErrors={validationErrors}
        />
      )}
      <InformationCard
        applicationDetails={applicationDetails}
        applicationSubmitHandler={handleSubmit}
        applicationSubmitted={applicationStatus === "submitted"}
        submissionLoading={loading}
      />
      <OpportunityCard opportunityOverview={opportunity} />
      <ApplicationFormsTable
        applicationForms={applicationForms}
        applicationId={applicationId}
        forms={forms}
      />
    </>
  );
};

const ApplicantionValidationAlert = ({
  applicationForms,
  forms,
  validationErrors,
}: {
  applicationForms: ApplicationFormDetail[];
  forms: CompetitionForms;
  validationErrors: FormValidationWarnings;
}) => {
  const t = useTranslations("Application");
  const formattedValidationErrors = Object.entries(validationErrors).map(
    ([appFormId, _validationErrors]) => {
      const appForm = applicationForms.find(
        (appForm) => appForm.application_form_id === appFormId,
      );
      const form = forms.find((form) => form.form.form_id === appForm?.form_id);
      return {
        appFormId,
        formName: form?.form.form_name,
      };
    },
  );
  const notStartedForms = applicationForms.filter(
    (applicationForm) =>
      applicationForm.application_form_status === "not_started",
  );
  const formattedNotStartedFormsErrors = notStartedForms.map(
    (notStartedForm) => {
      const form = forms.find(
        (form) => form.form.form_id === notStartedForm.form_id,
      );

      return {
        appFormId: notStartedForm.application_form_id,
        formName: form?.form.form_name,
      };
    },
  );

  return (
    <Alert
      validation
      heading={t("submissionError.title")}
      type="error"
      headingLevel="h3"
    >
      {t("submissionValidationError.description")}
      {formattedValidationErrors.length > 0 ? (
        <ul>
          {formattedValidationErrors.map(({ appFormId, formName }) => (
            <li key={appFormId}>
              <a href={`#form-${appFormId}`}>{formName}</a>{" "}
              {t("submissionValidationError.incompleteForm")}
            </li>
          ))}
          {formattedNotStartedFormsErrors.map(({ appFormId, formName }) => (
            <li key={appFormId}>
              <a href={`#form-${appFormId}`}>{formName}</a>{" "}
              {t("submissionValidationError.notStartedForm")}
            </li>
          ))}
        </ul>
      ) : (
        "No validation errors."
      )}
    </Alert>
  );
};

export default ApplicationContainer;
