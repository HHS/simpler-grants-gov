import { UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getUserOrganizations } from "src/services/fetch/fetchers/organizationsFetcher";
import { getUserPrivileges } from "src/services/fetch/fetchers/userFetcher";
import { Organization } from "src/types/applicationResponseTypes";
import { LocalizedPageProps } from "src/types/intl";
import { UserPrivilegesResponse } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import { UserOrganizationsList } from "src/components/workspace/UserOrganizationsList";

const OrganizationsPageWrapper = ({ children }: PropsWithChildren) => {
  const t = useTranslations("Organizations");
  return (
    <GridContainer>
      <h1 className="margin-top-9 margin-bottom-5">{t("pageTitle")}</h1>
      {children}
    </GridContainer>
  );
};

const OrganizationsErrorPage = () => {
  const t = useTranslations("Organizations");

  return (
    <OrganizationsPageWrapper>
      <div className="margin-bottom-15">
        <Alert slim={true} headingLevel="h6" noIcon={true} type="error">
          {t("errorMessage")}
        </Alert>
      </div>
    </OrganizationsPageWrapper>
  );
};

async function OrganizationsPage({ params }: LocalizedPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  let userOrganizations: Organization[];
  let userRoles: UserPrivilegesResponse;
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError(
        "No active session for viewing Organizations.",
      );
    }
    const userRolesPromise = getUserPrivileges(session.token, session.user_id);
    const userOrganizationsPromise = getUserOrganizations(
      session.token,
      session.user_id,
    );

    [userRoles, userOrganizations] = await Promise.all([
      userRolesPromise,
      userOrganizationsPromise,
    ]);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    return <OrganizationsErrorPage />;
  }

  return (
    <OrganizationsPageWrapper>
      <UserOrganizationsList
        userOrganizations={userOrganizations}
        userRoles={userRoles}
      />
    </OrganizationsPageWrapper>
  );
}

export default withFeatureFlag<LocalizedPageProps, never>(
  OrganizationsPage,
  "manageUsersOff",
  () => redirect("/maintenance"),
);
