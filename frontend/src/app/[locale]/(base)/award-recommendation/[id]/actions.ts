"use server";

export type AwardRecommendationActionResponse = {
  success?: boolean;
  errorMessage?: string;
  validationErrors?: Record<string, string[]>;
};

/**
 * Safely extracts a value from FormData with explicit null/File handling
 * @param formData - The FormData object
 * @param key - The key to extract
 * @returns The value as string, or empty string if null/undefined/File
 */
function getFormDataValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  // Handle null or undefined
  if (value === null || value === undefined) {
    return "";
  }

  // Handle File type - reject it
  if (value instanceof File) {
    console.warn(`Unexpected File type for form field "${key}"`);
    return "";
  }

  // Return the string value
  return value;
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function saveAwardRecommendation(
  formData: FormData,
): Promise<AwardRecommendationActionResponse> {
  // Extract form data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rawFormData = {
    additionalInfo: getFormDataValue(formData, "additional_info"),
    awardSelectionMethod: getFormDataValue(formData, "award_selection_method"),
    awardSelectionDetails: getFormDataValue(
      formData,
      "award_selection_details",
    ),
    otherKeyInformation: getFormDataValue(formData, "other_key_information"),
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
    additionalInfo: getFormDataValue(formData, "additional_info"),
    awardSelectionMethod: getFormDataValue(formData, "award_selection_method"),
    awardSelectionDetails: getFormDataValue(
      formData,
      "award_selection_details",
    ),
    otherKeyInformation: getFormDataValue(formData, "other_key_information"),
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
