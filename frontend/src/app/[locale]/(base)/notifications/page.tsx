import { getSession } from "src/services/auth/session";
import { getUserOrganizations } from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";

import { getTranslations } from "next-intl/server";
import { ReactElement } from "react";

import { NotificationsPageContent } from "src/components/notifications/NotificationsPageContent";
import { NotificationOrganization } from "src/components/notifications/NotificationTypes";

async function Notifications(): Promise<ReactElement | undefined> {
  const t = await getTranslations("Notifications");

  const session = await getSession();
  if (!session?.email) {
    console.error("No user session, or user has no email address");
    return;
  }

  let organizations: NotificationOrganization[] = [];
  let hasOrganizationsFetchError = false;

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
    />
  );
}

export default Notifications;
