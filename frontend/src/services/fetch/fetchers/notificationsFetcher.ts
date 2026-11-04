"server only";

import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
import {
  AllOpportunitiesNotificationPreferenceApiResponse,
  AllOpportunitiesNotificationPreferenceResponseData,
  SavedOpportunityNotificationPreferencesApiResponse,
  SavedOpportunityNotificationPreferencesResponseData,
  UpdateAllOpportunitiesNotificationPreferenceBody,
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

export const getAllOpportunitiesNotificationPreference = async (
  userId: string,
): Promise<AllOpportunitiesNotificationPreferenceResponseData> => {
  const response = await fetchUserWithMethod("GET")({
    subPath: `${userId}/all-opportunities/notifications`,
  });

  const json =
    (await response.json()) as AllOpportunitiesNotificationPreferenceApiResponse;

  return json.data;
};

export const updateAllOpportunitiesNotificationPreference = async (
  userId: string,
  body: UpdateAllOpportunitiesNotificationPreferenceBody,
): Promise<Response> => {
  return fetchUserWithMethod("POST")({
    subPath: `${userId}/all-opportunities/notifications`,
    body,
  });
};
