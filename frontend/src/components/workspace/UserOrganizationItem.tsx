"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { Organization } from "src/types/applicationResponseTypes";
import { UserPrivilegesResponse } from "src/types/userTypes";
import { userRoleForOrganization } from "src/utils/userUtils";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button, Grid } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

const ManageUsersButton = ({
  organization,
}: {
  organization: Organization;
}) => {
  const t = useTranslations("ActivityDashboard");
  return (
    <Link href={`/organization/${organization.organization_id}/manage-users`}>
      <Button type="button">
        <USWDSIcon name="people" /> {t("organizationButtons.manage")}
      </Button>
    </Link>
  );
};

const ViewDetailsButton = ({
  organization,
}: {
  organization: Organization;
}) => {
  const t = useTranslations("ActivityDashboard");
  return (
    <Link href={`/organization/${organization.organization_id}`}>
      <Button type="button">
        <USWDSIcon name="visibility" />
        {t("organizationButtons.view")}
      </Button>
    </Link>
  );
};

export const OrganizationItem = ({
  organization,
  userRoles,
}: {
  organization: Organization;
  userRoles: UserPrivilegesResponse;
}) => {
  const role = userRoleForOrganization(organization, userRoles);

  const orgPermissions = userRoles.organization_users.find(
    (role) =>
      role.organization.organization_id === organization.organization_id,
  );
  const canManageUsers = orgPermissions?.organization_user_roles.find((role) =>
    role.privileges.includes("manage_org_members"),
  );

  const { checkFeatureFlag } = useFeatureFlags();
  const manageUsersTurnedOn = !checkFeatureFlag("manageUsersOff");

  return (
    <li className="border-base-lighter border-1px padding-2 margin-top-2">
      <Grid row>
        <Grid tablet={{ col: "fill" }}>
          <div className="font-sans-2xs text-base-dark">{role}</div>
          <h3 className="margin-top-0">
            {organization.sam_gov_entity.legal_business_name}
          </h3>
        </Grid>
        <Grid
          tablet={{ col: "auto" }}
          className="flex-align-self-end text-right"
        >
          {canManageUsers && manageUsersTurnedOn ? (
            <ManageUsersButton organization={organization} />
          ) : (
            ""
          )}
          <ViewDetailsButton organization={organization} />
        </Grid>
      </Grid>
    </li>
  );
};
