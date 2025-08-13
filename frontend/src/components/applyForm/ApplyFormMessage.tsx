import { useTranslations } from "next-intl";
import { Alert } from "@trussworks/react-uswds";

import { FormValidationWarning } from "./types";

export const ApplyFormMessage = ({
  error,
  validationWarnings,
  saved,
}: {
  error: boolean;
  validationWarnings: FormValidationWarning[] | null;
  saved: boolean;
}) => {
  const t = useTranslations("Application.applyForm");
  const errorMessage = t.rich("errorMessage", {
    "email-link": (content) => (
      <a href="mailto:simpler@grants.gov">{content}</a>
    ),
    p: (content) => <p>{content}</p>,
  });
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
  } else if (validationWarnings && validationWarnings.length > 0) {
    return (
      <Alert
        heading={t("savedTitle")}
        headingLevel="h2"
        type="warning"
        validation
      >
        {t("validationMessage")}
        <ul>
          {validationWarnings.map((warning, index) => (
            <li key={index}>
              <a href={`#${warning.field}`}>{warning.message}</a>
            </li>
          ))}
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
