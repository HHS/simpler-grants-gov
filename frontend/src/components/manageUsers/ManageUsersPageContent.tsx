import { getSession } from "src/services/auth/session";
import {
  getOrganizationDetails,
  getOrganizationRoles,
  getOrganizationUsers,
} from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";
import { UserDetail, UserRole } from "src/types/userTypes";

import { getTranslations } from "next-intl/server";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { PageHeader } from "src/components/manageUsers/PageHeader";
import { ActiveUsersSection } from "./ActiveUsersSection";
import { UserOrganizationInvite } from "./UserOrganizationInvite";
import { LocalizedPageProps } from "src/types/intl";
import { ManageUsersPageParams } from "src/app/[locale]/(base)/organization/[id]/manage-users/page";

interface ManageUsersPageContentProps {
  params: ManageUsersPageParams
}

export async function ManageUsersPageContent({ params }: ManageUsersPageContentProps) {
  const t = await getTranslations("ManageUsers");
  const { id: organizationId } = params;

  let userOrganizations: Organization | undefined;

  const name = userOrganizations?.sam_gov_entity?.legal_business_name;

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <Breadcrumbs
        breadcrumbList={[
          { title: "home", path: "/" },
          {
            title: "Workspace",
            path: `/dashboard`,
          },
          {
            title: name ?? "Organization",
            path: `/organization/${organizationId}`,
          },
          {
            title: "Manage Users",
            path: `/organization/${organizationId}/manage-users`,
          },
        ]}
      />
      <PageHeader organizationName={name} pageHeader={t("pageHeading")} />
      <UserOrganizationInvite organizationId={organizationId} />
      <ActiveUsersSection organizationId={organizationId} />
    </GridContainer>
  );
}
