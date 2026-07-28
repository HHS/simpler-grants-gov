"use server";

import { ApiRequestError, parseErrorStatus } from "src/errors";
import {
  createCompetitionForGrantor,
  updateCompetitionForGrantor,
} from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";
import { FrontendErrorDetails } from "src/types/apiResponseTypes";
import {
  ApplicantTypes,
  CompetitionSaveRequest,
} from "src/types/competitionsResponseTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export type CompetitionActionState = {
  errorMessage?: string;
  successMessage?: string;
  validationErrors?: string[];
  newCompetitionId?: string;
};

// Make sure to return null in cases of empty string
function getFieldValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName) as string | null;
  return value !== null && value.length == 0 ? null : value;
}

function buildRequestBody(formData: FormData) {
  // Process Who can apply
  const openToApplicants: ApplicantTypes[] = [];
  const whoCanApply = formData.get("open_to_applicants") as string;
  switch (whoCanApply) {
    case "organizations_only":
      openToApplicants.push("organization");
      break;
    case "individuals_only":
      openToApplicants.push("individual");
      break;
    case "both": {
      openToApplicants.push("organization");
      openToApplicants.push("individual");
      break;
    }
    default:
      break;
  }
  // Concatinate Contact info
  const contactFields = [
    "contact_name",
    "contact_title",
    "contact_email",
    "contact_phone",
  ];
  const contactInfo = contactFields
    .map((field) => formData.get(field) as string)
    .filter(Boolean) // Removes null, undefined, or empty values
    .join(", ");

  // Build the request body which should match the CompetitionSaveRequest
  const requestBody: CompetitionSaveRequest = {
    competition_title: getFieldValue(formData, "competition_title"),
    opening_date: getFieldValue(formData, "opening_date"),
    closing_date: getFieldValue(formData, "closing_date"),
    contact_info: contactInfo,
    open_to_applicants: openToApplicants,
  };
  return requestBody;
}

export interface FrontendErrorCause {
  // The details area actually under the cause
  details: FrontendErrorDetails;
}

function formatValidationErrors(error: unknown) {
  const formatedErrors: string[] = [];
  if (error instanceof ApiRequestError) {
    const cause = error.cause as FrontendErrorCause;
    const details = cause.details;
    // console.log("DEBUG: cause: ", cause);
    // NOTE: currently this only returning one error at a time (no list)
    const errorMessage = details.field + ": " + details.message;
    return [errorMessage];
  }
  return formatedErrors;
}

export async function updateCompetition(
  formData: FormData,
): Promise<CompetitionActionState> {
  const t = await getTranslations("OpportunityCompetition.alerts");
  const opportunityId = formData.get("opportunityId") as string | null;
  let competitionId = formData.get("competitionId") as string | null;
  let apiResponse;

  // This should never be the case here,
  // but we need to account for this scenario to remove compile errors.
  if (!opportunityId) return { errorMessage: t("genericError") };

  const requestBody = buildRequestBody(formData);

  try {
    if (!competitionId) {
      apiResponse = await createCompetitionForGrantor(
        opportunityId,
        requestBody,
      );
      competitionId = apiResponse.data.competition_id;
      return {
        successMessage: t("success"),
        newCompetitionId: competitionId,
      };
    } else {
      apiResponse = await updateCompetitionForGrantor(
        opportunityId,
        competitionId,
        requestBody,
      );
    }
    return {
      successMessage: t("success"),
    };
  } catch (error) {
    const status =
      error instanceof ApiRequestError ? parseErrorStatus(error) : null;
    switch (status) {
      case 401:
        return { errorMessage: t("unauthenticated") };
      case 403:
        return { errorMessage: t("forbidden") };
      case 404:
        return { errorMessage: t("notFound") };
      case 422:
        return {
          errorMessage: t("validationErrors"),
          validationErrors: formatValidationErrors(error),
        };
      default:
        return { errorMessage: t("genericError") };
    }
  }
}

export async function competitionFormAction(
  submitType: string,
  formData: FormData,
): Promise<CompetitionActionState> {
  // 1. Save the form; if there are API errors, display them
  const saveResult = await updateCompetition(formData);
  if (saveResult.errorMessage) {
    return saveResult;
  }

  // 2. Perform workflow routing
  let routeTo = null;
  switch (submitType) {
    case "saveAndExit":
      routeTo = "../overview";
      break;
    case "saveAndGoBack":
      routeTo = "../edit";
      break;
    case "saveAndContinue":
      routeTo = "../overview";
      break;
    default:
      break;
  }
  if (!routeTo) {
    return saveResult;
  } else {
    redirect(routeTo);
  }
}
