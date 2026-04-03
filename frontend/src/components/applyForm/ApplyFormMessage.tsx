import { useTranslations } from "next-intl";
import { Alert } from "@trussworks/react-uswds";

import { FormattedFormValidationWarning } from "./types";

export const ApplyFormMessage = ({
  error,
  validationWarnings,
  saved,
  isBudgetForm = false,
}: {
  error: boolean;
  validationWarnings: FormattedFormValidationWarning[] | null;
  saved: boolean;
  isBudgetForm?: boolean;
}) => {
  const t = useTranslations("Application.applyForm");
  const errorMessage = t.rich("errorMessage", {
    "email-link": (content) => (
      <a href="mailto:simpler@grants.gov">{content}</a>
    ),
    p: (content) => <p>{content}</p>,
  });

  /**
   * Deduplicate validation warnings before rendering in the summary.
   *
   * Some warnings (particularly for FieldList child fields) can be emitted
   * multiple times during validation tree construction. This ensures each
   * unique warning message is only displayed once in the alert.
   *
   * Uses a composite key of `definition || field` and `message` to identify
   * unique warnings without altering the original warning shape.
   */
  const uniqueValidationWarnings = validationWarnings
  ? Array.from(
      new Map(
        validationWarnings.map((warning) => [
          `${warning.definition ?? warning.field}-${warning.message}`,
          warning,
        ]),
      ).values(),
    )
  : null;

  if (!saved) {
    return <></>;
  } else if (error) {
    return (
      <Alert
        heading={t("errorTitle")}
        headingLevel="h2"
        type="error"
        validation
      >
        {errorMessage}
      </Alert>
    );
  } else if (uniqueValidationWarnings && uniqueValidationWarnings.length > 0) {
    return (
      <Alert
        heading={t("savedTitle")}
        headingLevel="h2"
        type="warning"
        validation
      >
        {t("validationMessage")}
        <ul>
          {uniqueValidationWarnings.map((warning, index) => {
            const link = isBudgetForm ? (
              <a href={`#${warning.field}`}>{warning.message}</a>
            ) : (
              <a href={`#${warning.htmlField || ""}`}>{warning.formatted}</a>
            );
            return <li key={`${warning.definition ?? warning.field}-${warning.message}`}>{link}</li>;
          })}
        </ul>
      </Alert>
    );
  } else {
    return (
      <Alert heading={t("savedTitle")} headingLevel="h3" type="success">
        {t("savedMessage")}
      </Alert>
    );
  }
};
