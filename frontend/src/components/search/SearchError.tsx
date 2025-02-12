"use client";

import { FrontendErrorDetails } from "src/types/apiResponseTypes";
import { OptionalStringDict } from "src/types/generalTypes";
import { ErrorProps } from "src/types/uiTypes";

import { useTranslations } from "next-intl";
import { Alert } from "@trussworks/react-uswds";

import ServerErrorAlert from "src/components/ServerErrorAlert";

export interface ParsedError {
  message?: string;
  searchInputs?: OptionalStringDict;
  status?: number;
  type?: string;
  details?: FrontendErrorDetails;
}

function isValidJSON(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false; // String is not valid JSON
  }
}

// note that the SearchFilters component is not used here since that is a server component
// we work around that by including the rendered components from SearchFilters, but manually
// passing through the agency options as received from global state rather than fetching from API
export function SearchError({ error }: ErrorProps) {
  const t = useTranslations("Search");

  const parsedErrorData = isValidJSON(error.message)
    ? (JSON.parse(error.message) as ParsedError)
    : {};

  // note that the validation error will contain untranslated strings
  // and will only appear in development, prod builds will not include user facing error details
  const ErrorAlert =
    parsedErrorData.details && parsedErrorData.type === "ValidationError" ? (
      <Alert type="error" heading={t("validationError")} headingLevel="h4">
        {`Error in ${parsedErrorData.details.field || "a search field"}: ${parsedErrorData.details.message || "adjust your search and try again"}`}
      </Alert>
    ) : (
      <ServerErrorAlert callToAction={t("generic_error_cta")} />
    );

  return <div className="tablet:grid-col-8">{ErrorAlert}</div>;
}
