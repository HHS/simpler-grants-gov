import { ApplicationDetail, ApplicationFormDetail } from "src/types/applicationResponseTypes";
import { CompetitionForms } from "src/types/competitionsResponseTypes";



import { useTranslations } from "next-intl";
import Link from "next/link";
import { Table } from "@trussworks/react-uswds";



import { FormValidationWarning } from "src/components/applyForm/types";
import { USWDSIcon } from "src/components/USWDSIcon";
import { IncludeFormInSubmissionRadio } from "./IncludeFormInSubmissionRadio";


export const selectApplicationFormsByRequired = ({
  applicationForms,
  forms,
  required,
}: {
  applicationForms: ApplicationFormDetail[];
  forms: CompetitionForms;
  required: boolean;
}): ApplicationFormDetail[] => {
  const filteredFormIds = forms
    .filter((form) => form.is_required === required)
    .map((form) => form.form.form_id);

  return applicationForms.filter((form) =>
    filteredFormIds.includes(form.form_id),
  );
};

const selectApplicationForm = ({
  applicationForms,
  formId,
}: {
  applicationForms: ApplicationFormDetail[];
  formId: string;
}) => {
  return applicationForms
    ? applicationForms.find(
        (applicationForm) => applicationForm.form_id === formId,
      )
    : null;
};

export const ApplicationFormsTable = ({
  competitionInstructionsDownloadPath,
  errors = null,
  applicationDetailsObject,
}: {
  competitionInstructionsDownloadPath: string;
  errors?: FormValidationWarning[] | null;
  applicationDetailsObject: ApplicationDetail;
}) => {
  const forms = applicationDetailsObject.competition.competition_forms;
  const applicationForms = applicationDetailsObject.application_forms;
  const conditionalRequiredForms = selectApplicationFormsByRequired({
    applicationForms,
    forms,
    required: false,
  });
  const t = useTranslations("Application.competitionFormTable");

  return (
    <>
      <h3>{t("requiredForms")}</h3>
      <ApplicationTable
        formsAreOptional={false}
        applicationDetailsObject={applicationDetailsObject}
      />
      {conditionalRequiredForms.length > 0 && (
        <>
          <h3>{t("conditionalForms")}</h3>
          <p>
            {t.rich("conditionalFormsDescription", {
              instructionsLink: (chunks) => {
                return competitionInstructionsDownloadPath ? (
                  <a href={competitionInstructionsDownloadPath}>{chunks}</a>
                ) : (
                  <span>{chunks}</span>
                );
              },
            })}
          </p>
          <ApplicationTable
            formsAreOptional={true}
            errors={errors}
            applicationDetailsObject={applicationDetailsObject}
          />
        </>
      )}
    </>
  );
};

const selectApplicationFormById = ({
  forms,
  formId,
}: {
  forms: CompetitionForms;
  formId: string;
}) => {
  return forms.find((form) => form.form.form_id === formId);
};

const ApplicationTableColumnError = ({
  errorMessage,
}: {
  errorMessage: string;
}) => {
  return (
    <div className="display-flex flex-align-center margin-top-1">
      <USWDSIcon
        name="error_outline"
        className="text-error usa-icon--size-3 margin-right-05"
      />
      <p className={"font-sans-3xs margin-top-0"}>{errorMessage}</p>
    </div>
  );
};

const ApplicationTable = ({
  errors = null,
  applicationDetailsObject,
  formsAreOptional = false,
}: {
  errors?: FormValidationWarning[] | null;
  applicationDetailsObject: ApplicationDetail;
  formsAreOptional: boolean;
}) => {
  const forms = applicationDetailsObject.competition.competition_forms;
  const applicationForms = applicationDetailsObject.application_forms;
  const applicationId = applicationDetailsObject.application_id;
  const applicationStatus = applicationDetailsObject.application_status;
  const t = useTranslations("Application.competitionFormTable");
  const formIdsWithErrors = errors ? errors.map((item) => item.value) : [];

  /**
   * This function returns errors under the form link column only in the conditional forms table
   * and when there are relevant validation errors after submission.
   */
  const getFormLinkErrors = (form: ApplicationFormDetail) =>
    formsAreOptional &&
    errors &&
    formIdsWithErrors.includes(form.application_form_id) && (
      <ApplicationTableColumnError
        errorMessage={t("includeFormInApplicationSubmissionIncompleteMessage")}
      />
    );

  return (
    <Table className="width-full overflow-wrap simpler-application-forms-table">
      <thead>
        <tr>
          {formsAreOptional && (
            <th scope="col" className="bg-base-lightest padding-y-205 maxw-15">
              {t("includeFormInApplicationSubmissionDataLabel")}
            </th>
          )}
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("form")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("instructions")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("updated")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("updatedBy")}
          </th>
        </tr>
      </thead>
      <tbody>
        {applicationForms.map((form, index) => (
          <tr key={index} id={`form-${form.application_form_id}`}>
            {formsAreOptional && (
              <td data-label={t("includeFormInApplicationSubmissionDataLabel")}>
                <IncludeFormInSubmissionRadio
                  applicationId={applicationId}
                  formId={form.form_id}
                  includeFormInApplicationSubmission={
                    form.is_included_in_submission
                  }
                  applicationStatus={applicationStatus}
                />
              </td>
            )}
            <td data-label={t("form")}>
              <FormLink
                formId={form.form_id}
                forms={forms}
                applicationId={applicationId}
                appFormId={form.application_form_id}
              />
              {getFormLinkErrors(form)}
              <CompetitionStatus
                applicationForms={applicationForms}
                formId={form.form_id}
              />
            </td>
            <td data-label={t("instructions")}>
              <InstructionsLink
                forms={forms}
                formId={form.form_id}
                text={t("downloadInstructions")}
                unavailableText={t("attachmentUnavailable")}
              />
            </td>
            <td data-label={t("updated")}>
              <div> -- </div>
            </td>
            <td data-label={t("updatedBy")}>
              <div> -- </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

const CompetitionStatus = ({
  formId,
  applicationForms,
}: {
  applicationForms: ApplicationFormDetail[];
  formId: string;
}) => {
  const t = useTranslations("Application.competitionFormTable.statuses");
  const applicationForm = selectApplicationForm({ formId, applicationForms });

  if (applicationForm?.application_form_status === "in_progress") {
    return (
      <div className="display-flex flex-align-center text-italic">
        <USWDSIcon
          name="error_outline"
          className="margin-right-1 usa-icon--size-3 icon-active"
        />
        {t("in_progress")}
      </div>
    );
  } else if (applicationForm?.application_form_status === "complete") {
    return (
      <div className="display-flex flex-align-center text-italic">
        <USWDSIcon
          name="check_circle_outline"
          className="text-primary margin-right-1 usa-icon--size-3 icon-active"
        />
        {t("complete")}
      </div>
    );
  }
};

const InstructionsLink = ({
  formId,
  forms,
  text,
  unavailableText,
}: {
  formId: string;
  forms: CompetitionForms;
  text: string;
  unavailableText: string;
}) => {
  const form = selectApplicationFormById({
    forms,
    formId,
  });
  const instructions = form?.form.form_instruction;
  const downloadPath = instructions?.download_path || null;
  return (
    <>
      {downloadPath ? (
        <Link
          className="display-flex flex-align-center font-sans-2xs"
          href={downloadPath}
        >
          <USWDSIcon name="save_alt" className="margin-right-05" />
          {text}
        </Link>
      ) : (
        <>{unavailableText}</>
      )}
    </>
  );
};

const FormLink = ({
  formId,
  forms,
  applicationId,
  appFormId,
}: {
  formId: string;
  forms: CompetitionForms;
  applicationId: string;
  appFormId: string;
}) => {
  const form = selectApplicationFormById({
    forms,
    formId,
  });
  const formName = form?.form.form_name;

  return (
    <>
      {formName && (
        <Link
          className="text-bold"
          href={`/workspace/applications/application/${applicationId}/form/${appFormId}`}
        >
          {formName}
        </Link>
      )}
    </>
  );
};
