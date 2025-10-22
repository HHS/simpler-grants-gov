import { Metadata } from "next";
import { WORKSPACE_CRUMBS } from "src/constants/breadcrumbs";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getUserOrganizations } from "src/services/fetch/fetchers/organizationsFetcher";
import {
  getUserInvitations,
  getUserPrivileges,
} from "src/services/fetch/fetchers/userFetcher";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { UserOrganizationInvite } from "src/components/workspace/UserOrganizationInvite";
import { UserOrganizationsList } from "src/components/workspace/UserOrganizationsList";
import { WorkspaceLinksSection } from "src/components/workspace/WorkspaceLinksSection";

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

async function UserWorkspace() {
  const t = await getTranslations("UserWorkspace");

  const session = await getSession();
  if (!session?.email) {
    // this won't happen, as email is required on sessions, and we're wrapping this in an auth gate in the layout
    console.error("no user session, or user has no email address");
    return;
  }
  let userRoles;
  let userOrganizations;
  let userInvitations;
  const userRolesPromise = getUserPrivileges(session.token, session.user_id);
  const userOrganizationsPromise = getUserOrganizations(
    session.token,
    session.user_id,
  );
  const userInvitationsPromise = getUserInvitations(
    session.token,
    session.user_id,
  );
  try {
    [userRoles, userOrganizations, userInvitations] = await Promise.all([
      userRolesPromise,
      userOrganizationsPromise,
      userInvitationsPromise,
    ]);
  } catch (e) {
    console.error("Unable to fetch user details or organizations", e);
  }

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <Breadcrumbs breadcrumbList={WORKSPACE_CRUMBS} />
      <h1 className="margin-top-2">
        {t.rich("title", {
          color: (chunks) => (
            <span className="text-primary-dark">{chunks}</span>
          ),
        })}
      </h1>
      <UserOrganizationInvite
        organizationId={
          userOrganizations && userOrganizations[0]
            ? userOrganizations[0].organization_id
            : "1"
        }
      />
      {userInvitations?.length && (
        <AcceptOrganizationInvitation userInvitations={userInvitations} />
      )}
      <WorkspaceLinksSection />
      {userRoles && userOrganizations ? (
        <UserOrganizationsList
          userOrganizations={userOrganizations}
          userRoles={userRoles}
        />
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
