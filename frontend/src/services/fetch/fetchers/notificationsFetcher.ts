"server only";

import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
import {
  SavedOpportunityNotificationPreferencesApiResponse,
  SavedOpportunityNotificationPreferencesResponseData,
  UpdateSavedOpportunityNotificationPreferenceBody,
} from "src/types/preferences/notificationPreferenceTypes";

export const getSavedOpportunityNotificationPreferences = async (
  userId: string,
): Promise<SavedOpportunityNotificationPreferencesResponseData> => {
  const response = await fetchUserWithMethod("GET")({
    subPath: `${userId}/saved-opportunities/notifications`,
  });

  const json =
    (await response.json()) as SavedOpportunityNotificationPreferencesApiResponse;

  return json.data;
};

export const updateSavedOpportunityNotificationPreference = async (
  userId: string,
  body: UpdateSavedOpportunityNotificationPreferenceBody,
): Promise<Response> => {
  return fetchUserWithMethod("POST")({
    subPath: `${userId}/saved-opportunities/notifications`,
    body,
  });
};
