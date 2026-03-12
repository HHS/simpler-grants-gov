"use server";

import { getTranslations } from "next-intl/server";

export type AwardRecommendationActionResponse = {
  success?: boolean;
  errorMessage?: string;
  validationErrors?: Record<string, string[]>;
};

export async function saveAwardRecommendation(
  formData: FormData,
): Promise<AwardRecommendationActionResponse> {
  const t = await getTranslations("AwardRecommendation");

  // Extract form data
  const rawFormData = {
    otherOpportunityInfo: formData.get("other-opportunity-info") as string,
    otherKeyInformation: formData.get("other-key-information") as string,
  };

  try {
    // TODO: Implement save functionality when endpoint is available
    // const response = await saveAwardRecommendationAPI(rawFormData);
    console.log("Save clicked - Form data:", rawFormData);

    return {
      success: true,
    };
  } catch (e) {
    const error = e as Error;
    console.error(
      `Error saving award recommendation - ${error.message} ${error.cause?.toString() || ""}`,
    );
    return {
      errorMessage: error.message,
    };
  }
}

export async function submitAwardRecommendationForReview(
  formData: FormData,
): Promise<AwardRecommendationActionResponse> {
  const t = await getTranslations("AwardRecommendation");

  // Extract form data
  const rawFormData = {
    otherOpportunityInfo: formData.get("other-opportunity-info") as string,
    otherKeyInformation: formData.get("other-key-information") as string,
  };

  try {
    // TODO: Implement submit for review functionality when endpoint is available
    // const response = await submitAwardRecommendationAPI(rawFormData);
    console.log("Submit for review clicked - Form data:", rawFormData);

    return {
      success: true,
    };
  } catch (e) {
    const error = e as Error;
    console.error(
      `Error submitting award recommendation - ${error.message} ${error.cause?.toString() || ""}`,
    );
    return {
      errorMessage: error.message,
    };
  }
}
