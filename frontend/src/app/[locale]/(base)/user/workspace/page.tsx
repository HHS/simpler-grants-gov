import { Metadata } from "next";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getUserOrganizations } from "src/services/fetch/fetchers/organizationsFetcher";
import { getUserPrivileges } from "src/services/fetch/fetchers/userFetcher";
import { Organization } from "src/types/applicationResponseTypes";
import { LocalizedPageProps } from "src/types/intl";
import { UserPrivilegesResponse } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Button,
  ErrorMessage,
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

import { UserOrganizationInvite } from "src/components/workspace/UserOrganizationInvite";

export async function generateMetadata({
  params,
}: LocalizedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("UserWorkspace.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}

// find the user's role within the passed organization
const userRoleForOrganization = (
  organization: Organization,
  user: UserPrivilegesResponse,
): string => {
  const organizationPrivilegeSet = user.organization_users.find(
    (role) =>
      role.organization.organization_id === organization.organization_id,
  );
  if (!organizationPrivilegeSet) {
    console.error("no user roles for organization");
    return "";
  }
  return organizationPrivilegeSet.organization_user_roles.length > 1
    ? organizationPrivilegeSet.organization_user_roles
        .map((role) => role.role_name)
        .join(", ")
    : organizationPrivilegeSet.organization_user_roles[0].role_name;
};

const OrganizationItem = ({
  organization,
  role,
}: {
  organization: Organization;
  role: string;
}) => {
  const t = useTranslations("UserWorkspace");
  return (
    <li className="border-base-lighter border-1px padding-2 margin-top-2">
      <Grid row>
        <Grid tablet={{ col: 6 }}>
          <div className="font-sans-2xs text-base-dark">{role}</div>
          <h3 className="margin-top-0">
            {organization.sam_gov_entity.legal_business_name}
          </h3>
        </Grid>
        <Grid tablet={{ col: 6 }} className="flex-align-self-end text-right">
          <Link href={`/organization/${organization.organization_id}`}>
            <Button type="button">{t("organizationButtons.view")}</Button>
          </Link>
        </Grid>
      </Grid>
    </li>
  );
};

const NoOrganizations = () => {
  const t = useTranslations("UserWorkspace.noOrganizations");
  return (
    <li className="border-primary border-1px padding-2 margin-top-2">
      <h3>{t("title")}</h3>
      <div>{t("description")}</div>
    </li>
  );
};

const UserOrganizationsList = ({
  userOrganizations,
  userRoles,
}: {
  userOrganizations: Organization[];
  userRoles: UserPrivilegesResponse;
}) => {
  const t = useTranslations("UserWorkspace");
  return (
    <>
      <h2>{t("organizations")}</h2>
      <ul className="usa-list--unstyled">
        {!userOrganizations.length ? (
          <NoOrganizations />
        ) : (
          <>
            {userOrganizations.map((userOrganization) => (
              <OrganizationItem
                organization={userOrganization}
                role={userRoleForOrganization(userOrganization, userRoles)}
                key={userOrganization.organization_id}
              />
            ))}
          </>
        )}
      </ul>
    </>
  );
};

// add breadcrumb
async function UserWorkspace() {
  const t = await getTranslations("UserWorkspace");

  const session = await getSession();
  if (!session?.email) {
    // this won't happen, as email is required on sessions, and we're wrapping this in an auth gate in the layout
    console.error("no user session, or user has no email address");
    return;
  }
  let userRoles;
  let userOrganizations: Organization[] = [];
  const userRolesPromise = getUserPrivileges(session.token, session.user_id);
  const userOrganizationsPromise = getUserOrganizations(
    session.token,
    session.user_id,
  );
  try {
    [userRoles, userOrganizations] = await Promise.all([
      userRolesPromise,
      userOrganizationsPromise,
    ]);
  } catch (e) {
    console.error("Unable to fetch user details", e);
  }

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <h1>
        {t.rich("title", {
          color: (chunks) => (
            <span className="text-action-primary">{chunks}</span>
          ),
        })}
      </h1>
      {userRoles && userOrganizations ? (
        <>
          <UserOrganizationInvite
            organizationId={userOrganizations[0].organization_id}
          />
          <UserOrganizationsList
            userOrganizations={userOrganizations}
            userRoles={userRoles}
          />
        </>
      ) : (
        <ErrorMessage>{t("fetchError")}</ErrorMessage>
      )}
    </GridContainer>
  );
}

export default withFeatureFlag<object, never>(
  UserWorkspace,
  "userAdminOff",
  () => redirect("/maintenance"),
);
