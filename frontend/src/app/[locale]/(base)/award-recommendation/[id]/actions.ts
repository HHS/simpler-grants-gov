"use server";

export type AwardRecommendationActionResponse = {
  success?: boolean;
  errorMessage?: string;
  validationErrors?: Record<string, string[]>;
};

// eslint-disable-next-line @typescript-eslint/require-await
export async function saveAwardRecommendation(
  formData: FormData,
): Promise<AwardRecommendationActionResponse> {
  // Extract form data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rawFormData = {
    additionalInfo: formData.get("additional_info") as string,
    awardSelectionMethod: formData.get("award_selection_method") as string,
    awardSelectionDetails: formData.get("award_selection_details") as string,
    otherKeyInformation: formData.get("other_key_information") as string,
  };

  try {
    // TODO: Implement save functionality when endpoint is available
    // const response = await saveAwardRecommendationAPI(rawFormData);

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

// eslint-disable-next-line @typescript-eslint/require-await
export async function submitAwardRecommendationForReview(
  formData: FormData,
): Promise<AwardRecommendationActionResponse> {
  // Extract form data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rawFormData = {
    additionalInfo: formData.get("additional_info") as string,
    awardSelectionMethod: formData.get("award_selection_method") as string,
    awardSelectionDetails: formData.get("award_selection_details") as string,
    otherKeyInformation: formData.get("other_key_information") as string,
  };

  try {
    // TODO: Implement submit for review functionality when endpoint is available
    // const response = await submitAwardRecommendationAPI(rawFormData);

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
