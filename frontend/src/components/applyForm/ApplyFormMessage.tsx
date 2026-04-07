import { useTranslations } from "next-intl";
import { Alert } from "@trussworks/react-uswds";

import { FormattedFormValidationWarning } from "./types";

/**
 * Summary link text for validation warnings.
 *
 * For repeatable FieldList inputs, multiple rows can contain the same child
 * field name (for example, multiple `first_name` fields). In those cases,
 * the base formatted message alone is not specific enough in the summary.
 *
 * When the warning points to a row-specific FieldList input, we append:
 * - the FieldList name derived from the schema definition
 *
 * Example:
 *   "First Name is required"
 *
 * becomes:
 *   [field (definition, row number)]
 *   "First Name is required (Contact People, Entry 2)"
 */

export const getWarningLinkText = (
  warning: FormattedFormValidationWarning,
): string => {
  const baseText = warning.formatted ?? warning.message;

  const rowMatch = warning.htmlField?.match(/\[(\d+)\]--/);

  if (!rowMatch) {
    return baseText;
  }

  const rowIndex = Number(rowMatch[1]);

  if (Number.isNaN(rowIndex)) {
    return baseText;
  }

  const definitionMatch = warning.definition?.match(
    /^\/properties\/([^/]+)\/items\/properties\/[^/]+$/,
  );

  let fieldListLabel = "";

  if (definitionMatch) {
    const rawName = definitionMatch[1];

    fieldListLabel = rawName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (fieldListLabel) {
    return `${baseText} (${fieldListLabel}, Entry ${rowIndex + 1})`;
  }

  return `${baseText} (Entry ${rowIndex + 1})`;
};

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
   * unique warning is only displayed once in the alert.
   *
   * For row-aware FieldList warnings, `htmlField` is used as the primary key.
   * This preserves distinct warnings for different rows (e.g. Entry 2 vs Entry 3),
   * since each row produces a unique html field id.
   *
   * Falls back to `field` and then `definition` for non-row-aware warnings.
   */
  const uniqueValidationWarnings = validationWarnings
    ? Array.from(
        new Map(
          validationWarnings.map((warning) => [
            `${warning.htmlField ?? warning.field ?? warning.definition}-${warning.message}`,
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
          {uniqueValidationWarnings.map((warning) => {
            const link = isBudgetForm ? (
              <a href={`#${warning.field}`}>{warning.message}</a>
            ) : (
              <a href={`#${warning.htmlField || ""}`}>
                {getWarningLinkText(warning)}
              </a>
            );
            return (
              <li
                key={`${warning.htmlField ?? warning.field ?? warning.definition}-${warning.message}`}
              >
                {link}
              </li>
            );
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
