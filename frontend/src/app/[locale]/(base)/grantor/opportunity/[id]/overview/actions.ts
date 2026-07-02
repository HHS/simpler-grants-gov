"use server";

import { ApiRequestError, parseErrorStatus } from "src/errors";
import { publishOpportunityForGrantor } from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function publishFromOverview(opportunityId: string) {
  const alerts = await getTranslations("OpportunityEdit.content.alerts");

  try {
    await publishOpportunityForGrantor(opportunityId);
  } catch (error) {
    const status =
      error instanceof ApiRequestError ? parseErrorStatus(error) : null;

    if (status === 401) {
      return { errorMessage: alerts("unauthenticated") };
    }
    if (status === 403) {
      return { errorMessage: alerts("forbidden") };
    }
    if (status === 404) {
      return { errorMessage: alerts("notFound") };
    }
    return { errorMessage: alerts("genericError") };
  }

  redirect("/grantor/opportunities");
}
