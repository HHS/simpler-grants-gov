"use server";

import { getSession } from "src/services/auth/session";
import {
  updateAllOpportunitiesNotificationPreference,
  updateSavedOpportunityNotificationPreference,
} from "src/services/fetch/fetchers/notificationsFetcher";
import { logger } from "src/services/logger/simplerLogger";
import {
  UpdateAllOpportunitiesNotificationPreferenceApiResponse,
  UpdateSavedOpportunityNotificationPreferenceApiResponse,
} from "src/types/preferences/notificationPreferenceTypes";

import { getTranslations } from "next-intl/server";

export type UpdateNotificationPreferenceActionState =
  | {
      success: boolean;
      error: string | null;
    }
  | undefined;

export type UpdateSavedOpportunityNotificationPreferenceActionProps = {
  organizationId: string | null;
  emailEnabled: boolean;
};

export type UpdateAllOpportunitiesNotificationPreferenceActionProps = {
  isEnabled: boolean;
};

export const updateSavedOpportunityNotificationPreferenceAction = async ({
  organizationId,
  emailEnabled,
}: UpdateSavedOpportunityNotificationPreferenceActionProps): Promise<UpdateNotificationPreferenceActionState> => {
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
  } catch (e: unknown) {
    logger.error(
      { err: e, organizationId },
      "Update saved opportunity notification preference failed",
    );

    return {
      success: false,
      error: t("preferencesNotSavedError"),
    };
  }
};

export const updateAllOpportunitiesNotificationPreferenceAction = async ({
  isEnabled,
}: UpdateAllOpportunitiesNotificationPreferenceActionProps): Promise<UpdateNotificationPreferenceActionState> => {
  const t = await getTranslations("Notifications");
  const session = await getSession();

  if (!session || !session.token) {
    return {
      success: false,
      error: t("expiredSession"),
    };
  }

  try {
    const response = await updateAllOpportunitiesNotificationPreference(
      session.user_id,
      {
        is_enabled: isEnabled,
      },
    );

    const responseJson =
      (await response.json()) as UpdateAllOpportunitiesNotificationPreferenceApiResponse;

    if (!response.ok || responseJson.status_code !== 200) {
      throw new Error(
        `Failed to update all opportunities notification preference: ${responseJson.message}`,
      );
    }

    return {
      success: true,
      error: null,
    };
  } catch (e: unknown) {
    logger.error(
      { err: e },
      "Update all opportunities notification preference failed",
    );

    return {
      success: false,
      error: t("preferencesNotSavedError"),
    };
  }
};
