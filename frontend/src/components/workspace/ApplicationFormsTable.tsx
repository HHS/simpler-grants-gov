import { ApplicationFormDetail } from "src/types/applicationResponseTypes";
import { CompetitionForms } from "src/types/competitionsResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Table } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export const selectFormsByRequired = ({
  forms,
  required,
}: {
  forms: CompetitionForms;
  required: boolean;
}): FormDetail[] => {
  return forms.reduce<FormDetail[]>((acc, item) => {
    if (item.is_required === required) {
      acc.push(item.form);
    }
    return acc;
  }, []);
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
  const requiredForms = selectFormsByRequired({ forms, required: true });
  const conditionalRequiredForms = selectFormsByRequired({
    forms,
    required: false,
  });
  const t = useTranslations("Application.competitionFormTable");

  return (
    <>
      <h3>{t("requiredForms")}</h3>
      <ApplicationTable
        forms={requiredForms}
        applicationForms={applicationForms}
        applicationId={applicationId}
      />
      {conditionalRequiredForms.length > 0 && (
        <>
          <h3>{t("conditionalForms")}</h3>
          <p>{t("conditionalFormsDescription")}</p>
          <ApplicationTable
            forms={conditionalRequiredForms}
            applicationForms={applicationForms}
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
  forms: FormDetail[];
  formId: string;
}): FormDetail | undefined => {
  return forms.find((form) => form.form_id === formId);
};

const ApplicationTable = ({
  applicationForms,
  applicationId,
  forms,
}: {
  applicationForms: ApplicationFormDetail[];
  applicationId: string;
  forms: FormDetail[];
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
          <tr key={index}>
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
  forms: FormDetail[];
  text: string;
  unavailableText: string;
}) => {
  const instructions = selectApplicationFormById({
    forms,
    formId,
  })?.form_instruction;
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
  forms: FormDetail[];
  applicationId: string;
  appFormId: string;
}) => {
  const formName = selectApplicationFormById({
    forms,
    formId,
  })?.form_name;

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
