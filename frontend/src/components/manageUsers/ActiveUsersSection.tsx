import { getTranslations } from "next-intl/server";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import { RoleManager } from "src/components/manageUsers/RoleManager";


import type {
  UserDetail,
  UserRole,
} from "src/types/userTypes";
import type { AuthorizedData, FetchedResource } from "src/types/authTypes";
import { TableCellData, TableWithResponsiveHeader } from "../TableWithResponsiveHeader";

interface ActiveUsersSectionProps {
  organizationId: string;
  authorizedData?: AuthorizedData;
}

export async function ActiveUsersSection({
  authorizedData,
  organizationId,
}: ActiveUsersSectionProps) {
  const t = await getTranslations("ManageUsers");

  if (!authorizedData) {
    throw new Error("ActiveUsersList must be wrapped in AuthorizationGate");
  }

  // 👇 Just tell TS what these two resources are, using the existing FetchedResource type
  const {
    activeUsersList,
    organizationRolesList,
  } = authorizedData.fetchedResources as {
    activeUsersList: FetchedResource;
    organizationRolesList: FetchedResource;
  };

  const usersData = activeUsersList.data as UserDetail[] | undefined;
  const usersError = activeUsersList.error;

  const rolesData = organizationRolesList.data as UserRole[] | undefined;
  const rolesError = organizationRolesList.error;

  if (usersError || !usersData) {
    return (
      <GridContainer className="padding-top-2 tablet:padding-y-6">
        <ErrorMessage>{t("activeUsersFetchError")}</ErrorMessage>
      </GridContainer>
    );
  }

  // ✅ rolesData is now treated as UserRole[] | undefined
  const availableRoles: UserRole[] = rolesData ?? [];

  const roleOptions =
    availableRoles.length > 0
      ? availableRoles.map((role) => ({
          value: role.role_id,
          label: role.role_name,
        }))
      : [];

  const userData = usersData;

  const tableHeaders: TableCellData[] = [
    { cellData: t("usersTable.nameHeading") },
    { cellData: t("usersTable.emailHeading") },
    { cellData: t("usersTable.roleHeading") },
  ];

  const transformTableRowData = (userDetails: UserDetail[]) =>
    userDetails.map((user) => {
      const currentRoleId =
        user.roles && user.roles.length > 0
          ? user.roles[0].role_id
          : availableRoles[0]?.role_id ?? "";

      return [
        { cellData: `${user.first_name} ${user.last_name}` },
        { cellData: user.email },
        {
          cellData:
            roleOptions.length === 0 || !currentRoleId ? (
              (user.roles ?? [])
                .map((r) => r.role_name)
                .join(", ") || t("rolePicker.emptyState")
            ) : (
              <RoleManager
                organizationId={organizationId}
                userId={user.user_id}
                currentRoleId={currentRoleId}
                roleOptions={roleOptions}
              />
            ),
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

      {userData.length === 0 ? (
        <p className="maxw-full" data-testid="active-users-empty">
          {t("activeUsersTableZeroState")}
        </p>
      ) : (
        <TableWithResponsiveHeader
          headerContent={tableHeaders}
          tableRowData={transformTableRowData(userData)}
        />
      )}
    </section>
  );
}
