import { useClientFetch } from "src/hooks/useClientFetch";
import { ApplicationFormDetail } from "src/types/applicationResponseTypes";
import { CompetitionForms } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Table } from "@trussworks/react-uswds";

import { FormValidationWarning } from "src/components/applyForm/types";
import RadioWidget from "src/components/applyForm/widgets/RadioWidget";
import { USWDSIcon } from "src/components/USWDSIcon";

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
  applicationForms,
  applicationId,
  forms,
  errors = null,
}: {
  applicationForms: ApplicationFormDetail[];
  applicationId: string;
  forms: CompetitionForms;
  errors?: FormValidationWarning[] | null;
}) => {
  const requiredForms = selectApplicationFormsByRequired({
    applicationForms,
    forms,
    required: true,
  });
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
        forms={forms}
        applicationForms={requiredForms}
        applicationId={applicationId}
        formsAreOptional={false}
      />
      {conditionalRequiredForms.length > 0 && (
        <>
          <h3>{t("conditionalForms")}</h3>
          <p>{t("conditionalFormsDescription")}</p>
          <ApplicationTable
            forms={forms}
            applicationForms={conditionalRequiredForms}
            applicationId={applicationId}
            formsAreOptional={true}
            errors={errors}
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

const ApplicationTable = ({
  applicationForms,
  applicationId,
  forms,
  formsAreOptional = false,
  errors = null,
}: {
  applicationForms: ApplicationFormDetail[];
  applicationId: string;
  forms: CompetitionForms;
  formsAreOptional: boolean;
  errors?: FormValidationWarning[] | null;
}) => {
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
      <div className="display-flex flex-align-center text-bold text-error margin-top-1">
        <USWDSIcon
          name="error_outline"
          className="text-error usa-icon--size-1 margin-right-05"
        />
        <p className={"font-sans-3xs margin-top-0"}>
          {t("includeFormInApplicationSubmissionIncompleteMessage")}
        </p>
      </div>
    );

  return (
    <Table className="width-full overflow-wrap">
      <thead>
        <tr>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("status")}
          </th>
          {formsAreOptional && (
            <th scope="col" className="bg-base-lightest padding-y-205">
              {t("includeFormInApplicationSubmission")}
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
        </tr>
      </thead>
      <tbody>
        {applicationForms.map((form, index) => (
          <tr key={index} id={`form-${form.application_form_id}`}>
            <td data-label={t("status")}>
              <CompetitionStatus
                applicationForms={applicationForms}
                formId={form.form_id}
              />
            </td>
            {formsAreOptional && (
              <td data-label={t("includeFormInApplicationSubmission")}>
                <IncludeFormInSubmissionRadio
                  applicationId={applicationId}
                  formId={form.form_id}
                  includeFormInApplicationSubmission={
                    form.is_included_in_submission
                  }
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
      <div className="display-flex flex-align-center text-bold icon-active">
        <USWDSIcon name="loop" className="margin-right-2px" />
        {t("in_progress")}
      </div>
    );
  } else if (applicationForm?.application_form_status === "complete") {
    return (
      <div className="display-flex flex-align-center text-bold">
        <USWDSIcon name="check" className="text-primary margin-right-2px" />
        {t("complete")}
      </div>
    );
  } else {
    return <>-</>;
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

export const IncludeFormInSubmissionRadio = ({
  applicationId,
  formId,
  includeFormInApplicationSubmission,
}: {
  applicationId: string;
  formId: string;
  includeFormInApplicationSubmission?: boolean | null;
}) => {
  const router = useRouter();
  const { clientFetch } = useClientFetch<{
    is_included_in_submission: boolean;
  }>("Error submitting update include form in application submission");
  const [includeFormInSubmission, setIncludeFormInSubmission] = useState<
    boolean | null
  >(includeFormInApplicationSubmission ?? null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (value: string | unknown) => {
    const newValue = value === "Yes";
    setIncludeFormInSubmission(newValue); // eagerly set state.
    setLoading(true);
    clientFetch(`/api/applications/${applicationId}/forms/${formId}`, {
      method: "PUT",
      body: JSON.stringify({
        is_included_in_submission: newValue,
      }),
    })
      .then(({ is_included_in_submission }) => {
        if (is_included_in_submission === undefined) {
          throw new Error(
            "Error updating form to be included in submission. Value undefined",
          );
        }
      })
      .catch((err) => {
        // We will fall back to false on any errors to prevent blocking user workflows.
        setIncludeFormInSubmission(false);
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
        router.refresh();
      });
  };

  let radioValue = null;
  if (includeFormInSubmission) {
    radioValue = "Yes";
  } else if (includeFormInSubmission === false) {
    radioValue = "No";
  }

  return (
    <RadioWidget
      id={"include-form-in-application-submission-radio"}
      schema={{ enum: ["Yes", "No"] }}
      value={radioValue}
      options={{
        disabled: loading,
      }}
      updateOnInput={true}
      onChange={handleChange}
    />
  );
};
