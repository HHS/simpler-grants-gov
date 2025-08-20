import { ApplicationFormDetail } from "src/types/applicationResponseTypes";
import { CompetitionForms } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { Alert } from "@trussworks/react-uswds";

import { FormValidationWarning } from "src/components/applyForm/types";

const ApplicationValidationAlert = ({
  applicationForms,
  forms,
  validationErrors,
}: {
  applicationForms: ApplicationFormDetail[];
  forms: CompetitionForms;
  validationErrors: FormValidationWarning[] | undefined;
}) => {
  const t = useTranslations("Application");

  const validationErrorMessage = ({ type }: { type: string }) => {
    switch (type) {
      case "missing_required_form":
        return t("submissionValidationError.notStartedForm");
      case "application_form_validation":
        return t("submissionValidationError.incompleteForm");
      case "missing_included_in_submission":
        return t("submissionValidationError.missingIncludeInSubmission");
    }
  };

  const formattedValidationErrors =
    validationErrors && validationErrors?.length > 0
      ? validationErrors.map((error) => {
          if (error.field === "form_id") {
            const form = forms.find(
              (form) => form.form.form_id === error.value,
            );
            const appForm = applicationForms.find(
              (appForm) => appForm.form_id === form?.form.form_id,
            );
            return {
              message: validationErrorMessage({ type: error.type }),

              appFormId: appForm?.application_form_id,
              formName: form?.form.form_name,
            };
          } else if (
            error.field === "application_form_id" ||
            error.field === "is_included_in_submission"
          ) {
            const appForm = applicationForms.find(
              (appForm) => appForm.application_form_id === error.value,
            );
            const form = forms.find(
              (form) => form.form.form_id === appForm?.form_id,
            );
            return {
              message: validationErrorMessage({ type: error.type }),
              appFormId: error.value,
              formName: form?.form.form_name,
            };
          } else {
            console.error("Unexpected field validation type", error);
          }
          return {};
        })
      : [];

  return (
    <>
      {formattedValidationErrors.length > 0 ? (
        <Alert
          validation
          heading={t("submissionError.title")}
          type="error"
          headingLevel="h3"
        >
          {t("submissionValidationError.description")}
          <ul>
            {formattedValidationErrors.map(
              ({ appFormId, formName, message }) => (
                <li key={`${appFormId ?? ""}-${formName ?? ""}`}>
                  <a href={`#form-${String(appFormId)}`}>{formName}</a>{" "}
                  {message}
                </li>
              ),
            )}
          </ul>
        </Alert>
      ) : (
        <></>
      )}
    </>
  );
};

export default ApplicationValidationAlert;
