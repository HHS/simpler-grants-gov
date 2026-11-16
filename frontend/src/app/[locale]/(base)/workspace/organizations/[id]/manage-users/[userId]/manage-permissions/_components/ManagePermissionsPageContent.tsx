import { AuthorizedData } from "src/types/authTypes";

import { getTranslations } from "next-intl/server";
import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/core/Breadcrumbs";
import { UnauthorizedMessage } from "src/components/core/UnauthorizedMessage";
import { CurrentPermissions } from "./CurrentPermissions";
import {
  mockManagedUserPermissions,
  mockOrganizationApplications,
} from "./mockPermissionsData";
import { PermissionsPageNav } from "./PermissionsPageNav";
import { UpdatePermissionsForm } from "./UpdatePermissionsForm";

export async function ManagePermissionsPageContent({
  organizationId,
  authorizedData,
}: {
  organizationId: string;
  authorizedData?: AuthorizedData;
}) {
  if (!authorizedData) {
    throw new Error(
      "ManagePermissionsPageContent must be wrapped in AuthorizationGate",
    );
  }

  // The gate only blocks on a 403 from a fetched resource, and this page has
  // none yet, so the privilege check result has to be enforced here.
  const canManageMembers = authorizedData.confirmedPrivileges.some(
    ({ resourceId, privilege, authorized }) =>
      resourceId === organizationId &&
      privilege === "manage_org_members" &&
      authorized,
  );
  if (!canManageMembers) {
    return <UnauthorizedMessage />;
  }

  const t = await getTranslations("ManagePermissions");
  const tManageUsers = await getTranslations("ManageUsers");
  const user = mockManagedUserPermissions;

  return (
    <GridContainer className="padding-bottom-6">
      <Breadcrumbs
        breadcrumbList={[
          { title: tManageUsers("breadcrumbWorkspace"), path: "/workspace" },
          {
            title: tManageUsers("breadcrumbOrganizations"),
            path: "/workspace/organizations",
          },
          {
            title: t("breadcrumbOrganization"),
            path: `/workspace/organizations/${organizationId}`,
          },
          {
            title: tManageUsers("pageHeading"),
            path: `/workspace/organizations/${organizationId}/manage-users`,
          },
          { title: t("pageHeading") },
        ]}
      />
      {/* The External label is its own field and is never added to the name */}
      <h1 className="margin-top-0 margin-bottom-1 font-sans-xl">
        <span className="display-block margin-bottom-2 font-sans-md">
          {t("pageHeading")}
        </span>
        {t("userSummary", { name: user.name, roleName: user.roleName })}
      </h1>
      <p
        className="margin-top-0 margin-bottom-6 font-sans-2xs text-bold"
        data-testid="role-last-updated"
      >
        {t("roleLastUpdated", {
          name: user.roleLastUpdatedBy,
          date: user.roleLastUpdatedAt,
        })}
      </p>
      <div className="usa-in-page-nav-container">
        <div className="order-2 width-full">
          <CurrentPermissions roleName={user.roleName} />
          <hr className="border-base-lighter margin-y-5" />
          <UpdatePermissionsForm
            initialValues={{
              accessScope: user.accessScope,
              selectedApplicationIds: user.selectedApplicationIds,
              isExternal: user.isExternal,
            }}
            applications={mockOrganizationApplications}
          />
        </div>
        <PermissionsPageNav
          title={t("onThisPage")}
          fields={[
            {
              href: "current-permissions",
              text: t("currentPermissions.heading"),
            },
            {
              href: "update-permissions",
              text: t("updatePermissions.heading"),
            },
          ]}
        />
      </div>
    </GridContainer>
  );
}
