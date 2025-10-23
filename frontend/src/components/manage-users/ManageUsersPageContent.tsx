import { getSession } from "src/services/auth/session";
import { getUserOrganizations } from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";

import { getTranslations } from "next-intl/server";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import { PageHeader } from "src/components/manage-users/PageHeader";

export async function ManageUsersPageContent({
  organizationId,
}: {
  organizationId: string;
}) {
  const t = await getTranslations("ManageUsers");

  const session = await getSession();
  if (!session?.token) {
    return (
      <GridContainer className="padding-top-2 tablet:padding-y-6">
        <ErrorMessage>{t("errors.notLoggedInMessage")}</ErrorMessage>
      </GridContainer>
    );
  }
  let userOrganizations: Organization[] | undefined;
  try {
    const [organizationsResult] = await Promise.all([
      getUserOrganizations(session.token, session.user_id),
    ]);
    userOrganizations = organizationsResult;
  } catch (error) {
    console.error("Unable to fetch organization information", error);
  }
  const organization = (userOrganizations ?? []).find(
    (org) => org.organization_id === organizationId,
  );
  const name = organization?.sam_gov_entity?.legal_business_name;

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <PageHeader organizationName={name ?? ""} pageHeader={t("pageHeading")} />
    </GridContainer>
  );
}
