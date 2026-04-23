"use server";

import { getSession } from "src/services/auth/session";
import { updateSavedOpportunityNotificationPreference } from "src/services/fetch/fetchers/notificationsFetcher";
import { UpdateSavedOpportunityNotificationPreferenceApiResponse } from "src/types/preferences/notificationPreferenceTypes";

import { getTranslations } from "next-intl/server";

export type UpdateSavedOpportunityNotificationPreferenceActionState =
  | {
      success: boolean;
      error: string | null;
    }
  | undefined;

export type UpdateSavedOpportunityNotificationPreferenceActionProps = {
  organizationId: string | null;
  emailEnabled: boolean;
};

export const updateSavedOpportunityNotificationPreferenceAction = async ({
  organizationId,
  emailEnabled,
}: UpdateSavedOpportunityNotificationPreferenceActionProps): Promise<UpdateSavedOpportunityNotificationPreferenceActionState> => {
  const t = await getTranslations("Notifications");
  const session = await getSession();

  if (!session || !session.token) {
    return {
      success: false,
      error: t("expiredSession"),
    };
  }

  try {
    const response = await updateSavedOpportunityNotificationPreference(
      session.user_id,
      {
        organization_id: organizationId,
        email_enabled: emailEnabled,
      },
    );

    const responseJson =
      (await response.json()) as UpdateSavedOpportunityNotificationPreferenceApiResponse;

    if (!response.ok || responseJson.status_code !== 200) {
      throw new Error(
        `Failed to update saved opportunity notification preference: ${responseJson.message}`,
      );
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: unknown) {
    console.error(
      "Update saved opportunity notification preference failed:",
      error,
    );

    return {
      success: false,
      error: t("preferencesNotSavedError"),
    };
  }
};
