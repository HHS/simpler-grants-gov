import { getSession } from "src/services/auth/session";
import { getSavedOpportunityNotificationPreferences } from "src/services/fetch/fetchers/notificationsFetcher";
import { getUserOrganizations } from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";

import { getTranslations } from "next-intl/server";
import { ReactElement } from "react";

import { NotificationsPageContent } from "src/components/notifications/NotificationsPageContent";
import {
  NotificationOrganization,
  NotificationPreferenceValues,
} from "src/components/notifications/NotificationTypes";

const PERSONAL_PREFERENCE_KEY = "saved-opportunities";

function buildOrganizationPreferenceKey(organizationId: string): string {
  return `organization-${organizationId}-saved-opportunities`;
}

async function Notifications(): Promise<ReactElement | undefined> {
  const t = await getTranslations("Notifications");

  const session = await getSession();
  if (!session?.email) {
    console.error("No user session, or user has no email address");
    return;
  }

  let organizations: NotificationOrganization[] = [];
  let hasOrganizationsFetchError = false;
  const initialPreferenceValues: NotificationPreferenceValues = {
    [PERSONAL_PREFERENCE_KEY]: false,
  };

  try {
    const fetchedOrganizations: Organization[] = await getUserOrganizations(
      session.user_id,
    );

    organizations = fetchedOrganizations.map(
      (organization): NotificationOrganization => ({
        organizationId: organization.organization_id,
        organizationName: organization.sam_gov_entity.legal_business_name,
      }),
    );
  } catch (error: unknown) {
    console.error("Unable to fetch user organizations", error);
    hasOrganizationsFetchError = true;
  }

  try {
    const notificationPreferences =
      await getSavedOpportunityNotificationPreferences(session.user_id);

    initialPreferenceValues[PERSONAL_PREFERENCE_KEY] =
      notificationPreferences.self.email_enabled;

    notificationPreferences.organizations.forEach((organizationPreference) => {
      initialPreferenceValues[
        buildOrganizationPreferenceKey(organizationPreference.organization_id)
      ] = organizationPreference.email_enabled;
    });
  } catch (error: unknown) {
    console.error("Unable to fetch notification preferences", error);
    hasOrganizationsFetchError = true;
  }

  return (
    <NotificationsPageContent
      pageHeading={t("pageHeading")}
      fetchErrorMessage={t("fetchError")}
      managePreferencesTitle={t("managePreferencesTitle")}
      managePreferencesDescription={t("managePreferencesDescription")}
      organizationPreferencesTitle={t("organizationPreferencesTitle")}
      organizationPreferencesDescription={t(
        "organizationPreferencesDescription",
      )}
      savedOpportunitiesLabel={t("savedOpportunitiesLabel")}
      savedOpportunitiesDescription={t("savedOpportunitiesDescription")}
      organizationSavedOpportunitiesDescription={t(
        "organizationSavedOpportunitiesDescription",
      )}
      organizations={organizations}
      hasOrganizationsFetchError={hasOrganizationsFetchError}
      initialPreferenceValues={initialPreferenceValues}
    />
  );
}

export default Notifications;
