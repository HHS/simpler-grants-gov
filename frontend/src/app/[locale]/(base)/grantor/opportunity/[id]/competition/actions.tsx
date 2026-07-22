"use server";

import { ApiRequestError, parseErrorStatus } from "src/errors";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export type CompetitionActionState = {
  errorMessage?: string;
  successMessage?: string;
};

function readStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function updateCompetition(
  formData: FormData,
): Promise<CompetitionActionState> {
  const alerts = await getTranslations("OpportunityCompetition.alerts");

  try {
    // if (!competitionId) {
    //   const createResponse = await createOpportunitySummaryForGrantor({
    //     opportunityId,
    //     body: {
    //       ...buildCompetitionUpdateRequest(formData),
    //     },
    //   });
    //   return {
    //     successMessage: alerts("success"),
    //     newCompetitionId: createResponse.data.competition_id,
    //   };
    // }

    // If this is not the first save, then update the data.
    // await updateOpportunitySummaryForGrantor({
    //   opportunityId,
    //   competitionId,
    //   body: buildCompetitionUpdateRequest(formData),
    // });
    return {
      successMessage: alerts("success"),
    };
  } catch (error) {
    const status =
      error instanceof ApiRequestError ? parseErrorStatus(error) : null;
    switch (status) {
      case 401:
        return { errorMessage: alerts("unauthenticated") };
      case 403:
        return { errorMessage: alerts("forbidden") };
      case 404:
        return { errorMessage: alerts("notFound") };
      default:
        return { errorMessage: alerts("genericError") };
    }
  }
}

export async function competitionFormAction(
  submitType: string,
  formData: FormData,
): Promise<CompetitionActionState> {
  // 1. Save the form; if there are validation or API errors, display them
  const saveResult = await updateCompetition(formData);
  if (saveResult.errorMessage) {
    return saveResult;
  }

  // 2. Perform workflow routing
  switch (submitType) {
    case "saveAndExit":
      redirect("../overview");
    case "saveAndGoBack":
      redirect("../overview");
    case "saveAndContinue":
      redirect("../edit");
    default:
      return saveResult;
  }
}
