import type { FetchedResource } from "src/types/authTypes";
import type { UserDetail, UserRole } from "src/types/userTypes";
import { formatFullName } from "src/utils/userNameUtils";

import { getTranslations } from "next-intl/server";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import { RoleManager } from "src/components/manageUsers/RoleManager";
import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";

interface ActiveUsersSectionProps {
  organizationId: string;
  activeUsers: FetchedResource;
  roles: FetchedResource;
}

export async function ActiveUsersSection({
  organizationId,
  activeUsers,
  roles,
}: ActiveUsersSectionProps) {
  const t = await getTranslations("ManageUsers");

  const usersData = activeUsers.data as UserDetail[] | undefined;
  const usersError = activeUsers.error;

  const rolesData = roles.data as UserRole[] | undefined;
  const rolesError = roles.error;

  if (usersError || !usersData) {
    return (
      <GridContainer className="padding-top-2 tablet:padding-y-6">
        <ErrorMessage>{t("activeUsersFetchError")}</ErrorMessage>
      </GridContainer>
    );
  }

  const availableRoles: UserRole[] = rolesData ?? [];
  const roleOptions =
    availableRoles.length > 0
      ? availableRoles.map((role) => ({
          value: role.role_id,
          label: role.role_name,
        }))
      : [];

  const rolesFetchFailed = Boolean(rolesError);

  const tableHeaders: TableCellData[] = [
    { cellData: t("usersTable.nameHeading") },
    { cellData: t("usersTable.emailHeading") },
    { cellData: t("usersTable.roleHeading") },
  ];

  const transformTableRowData = (userDetails: UserDetail[]) =>
    userDetails.map((user) => {
      // Note: This does not take into account the case where a user has multiple roles
      // I assume the user's first role as their "current" role.
      // If the user has no roles, fall back to the first available org role,
      // otherwise leave it empty so we render read-only text.
      const currentRoleId =
        user.roles && user.roles.length > 0
          ? user.roles[0].role_id
          : (availableRoles[0]?.role_id ?? "");

      // We only allow editing when:
      // - the roles fetch succeeded
      // - we have at least one role option from the org
      // - we have a non-empty currentRoleId to bind the picker to
      const canEditRoles =
        !rolesFetchFailed && roleOptions.length > 0 && !!currentRoleId;

      // Prefer formatted full name; fall back to empty string if no name data is present.
      const name = formatFullName(user) || "";

      let roleCell: React.ReactNode;

      // Note: scaffolding this for future task to disable the dropdown for ebizpocs
      // If editing is allowed, show the role dropdown+modal
      // Otherwise, show the read-only role text
      if (canEditRoles) {
        roleCell = (
          <RoleManager
            organizationId={organizationId}
            userId={user.user_id}
            currentRoleId={currentRoleId}
            roleOptions={roleOptions}
          />
        );
      } else {
        // Text to display when we are not rendering the RoleManager:
        // join all assigned role names, or fall back is an empty string
        const roleText =
          (user.roles ?? []).map((r) => r.role_name).join(", ") || "";

        roleCell = roleText;
      }

      return [
        { cellData: name },
        { cellData: user.email },
        {
          cellData: roleCell,
        },
      ];
    });

  return (
    <section className="usa-table-container--scrollable margin-bottom-5 margin-top-5">
      <h2 className="margin-bottom-1 font-sans-lg">
        {t("activeUsersHeading")}
      </h2>
      <p className="margin-bottom-2 margin-top-1 maxw-full">
        {t("activeUsersTableDescription")}
      </p>

      {rolesFetchFailed && (
        <ErrorMessage className="margin-bottom-2">
          {t("roleManager.errorState")}
        </ErrorMessage>
      )}

      {usersData.length === 0 ? (
        <p className="maxw-full" data-testid="active-users-empty">
          {t("activeUsersTableZeroState")}
        </p>
      ) : (
        <TableWithResponsiveHeader
          headerContent={tableHeaders}
          tableRowData={transformTableRowData(usersData)}
        />
      )}
    </section>
  );
}
