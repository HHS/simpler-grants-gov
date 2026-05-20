import { APIResponse } from "src/types/apiResponseTypes";

export interface SavedOpportunityNotificationSelfPreference {
  email_enabled: boolean;
}

export interface SavedOpportunityNotificationOrganizationPreference {
  organization_id: string;
  email_enabled: boolean;
}

export interface SavedOpportunityNotificationPreferencesResponseData {
  self: SavedOpportunityNotificationSelfPreference;
  organizations: SavedOpportunityNotificationOrganizationPreference[];
}

export interface SavedOpportunityNotificationPreferencesApiResponse
  extends Omit<APIResponse, "data"> {
  data: SavedOpportunityNotificationPreferencesResponseData;
}

export interface UpdateSavedOpportunityNotificationPreferenceBody
  extends Record<string, unknown> {
  organization_id: string | null;
  email_enabled: boolean;
}

export interface UpdateSavedOpportunityNotificationPreferenceApiResponse
  extends Omit<APIResponse, "data"> {
  data: null;
}
