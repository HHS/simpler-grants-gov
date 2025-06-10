import { CompetitionForms } from "src/types/competitionsResponseTypes";
import { FormDetail, FormInstruction } from "src/types/formResponseTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Table } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export const CompetitionFormsTable = ({
  forms,
  applicationId,
}: {
  forms: CompetitionForms;
  applicationId: string;
}) => {
  const requiredForms = selectForms({ forms, required: true });
  const conditionalRequiredForms = selectForms({ forms, required: false });
  const t = useTranslations("Application.competitionFormTable");

  return (
    <>
      <h3>{t("requiredForms")}</h3>

      <CompetitionTable forms={requiredForms} applicationId={applicationId} />
      <h3>{t("conditionalForms")}</h3>

      <CompetitionTable
        forms={conditionalRequiredForms}
        applicationId={applicationId}
      />
    </>
  );
};

export const selectForms = ({
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

const CompetitionTable = ({
  forms,
  applicationId,
}: {
  forms: FormDetail[];
  applicationId: string;
}) => {
  const t = useTranslations("Application.competitionFormTable");

  return (
    <Table className="width-full overflow-wrap">
      <thead>
        <tr>
          <th scope="col" className="bg-base-lighter">
            {t("status")}
          </th>
          <th scope="col" className="bg-base-lighter">
            {t("form")}
          </th>
          <th scope="col" className="bg-base-lighter">
            {t("attachment")}
          </th>
          <th scope="col" className="bg-base-lighter">
            {t("instructions")}
          </th>
          <th scope="col" className="bg-base-lighter">
            {t("updated")}
          </th>
        </tr>
      </thead>
      <CompetitionTableBody forms={forms} applicationId={applicationId} />
    </Table>
  );
};

const CompetitionTableBody = ({
  forms,
  applicationId,
}: {
  forms: FormDetail[];
  applicationId: string;
}) => {
  const t = useTranslations("Application.competitionFormTable");

  return (
    <tbody>
      {forms.map((form, index) => (
        <tr key={index}>
          <td data-label={t("status")}>--</td>
          <td data-label={t("form")}>
            <Link
              className="text-bold"
              href={`/workspace/applications/application/${applicationId}/form/${form.form_id}`}
            >
              {form.form_name}
            </Link>
          </td>
          <td data-label={t("attachment")}>
            <div> -- </div>
          </td>
          <td data-label={t("instructions")}>
            <InstructionsLink
              instsruction={form.form_instruction}
              text={t("downloadInstructions")}
            />
          </td>
          <td data-label={t("updated")}>
            <div> -- </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

const InstructionsLink = ({
  instsruction,
  text,
}: {
  instsruction: FormInstruction;
  text: string;
}) => {
  return (
    <Link
      className="display-flex flex-align-center font-sans-2xs"
      href={instsruction.download_path}
    >
      <USWDSIcon name="save_alt" className="margin-right-05" />
      {text}
    </Link>
  );
};
