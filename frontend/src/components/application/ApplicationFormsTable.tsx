import { ApplicationFormDetail } from "src/types/applicationResponseTypes";
import { CompetitionForms } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Table } from "@trussworks/react-uswds";

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
}: {
  applicationForms: ApplicationFormDetail[];
  applicationId: string;
  forms: CompetitionForms;
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
      />
      {conditionalRequiredForms.length > 0 && (
        <>
          <h3>{t("conditionalForms")}</h3>
          <p>{t("conditionalFormsDescription")}</p>
          <ApplicationTable
            forms={forms}
            applicationForms={conditionalRequiredForms}
            applicationId={applicationId}
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
}: {
  applicationForms: ApplicationFormDetail[];
  applicationId: string;
  forms: CompetitionForms;
}) => {
  const t = useTranslations("Application.competitionFormTable");

  return (
    <Table className="width-full overflow-wrap">
      <thead>
        <tr>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("status")}
          </th>
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
            <td data-label={t("form")}>
              <FormLink
                formId={form.form_id}
                forms={forms}
                applicationId={applicationId}
                appFormId={form.application_form_id}
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
