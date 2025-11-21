import { UnauthorizedError } from "src/errors";
import { getOrganizationUsers } from "src/services/fetch/fetchers/organizationsFetcher";
import type { UserDetail, UserRole } from "src/types/userTypes";

import { getTranslations } from "next-intl/server";
import React from "react";
import { Alert } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";

function formatFullName(user: UserDetail): string {
  if (!user) return " ";

  const parts = [user.first_name, user.last_name].filter(Boolean);

  return parts.join(" ");
}

function formatRoleNames(roles?: UserRole[]): string {
  if (!roles || roles.length === 0) {
    return "";
  }

  return roles.map((role) => role.role_name).join(", ");
}

interface ActiveUsersSectionProps {
  organizationId: string;
}

export async function ActiveUsersSection({
  organizationId,
}: ActiveUsersSectionProps) {
  const t = await getTranslations("ManageUsers");
  let userData: UserDetail[] = [];
  let hasError = false;

  try {
    userData = await getOrganizationUsers(organizationId);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    hasError = true;
  }

  const tableHeaders: TableCellData[] = [
    { cellData: t("usersTable.nameHeading") },
    { cellData: t("usersTable.emailHeading") },
    { cellData: t("usersTable.roleHeading") },
  ];

  const transformTableRowData = (userDetails: UserDetail[]) => {
    return userDetails.map((user) => {
      return [
        { cellData: formatFullName(user) },
        { cellData: user.email },
        { cellData: formatRoleNames(user.roles) },
      ];
    });
  };

  return (
    <section className="usa-table-container--scrollable margin-bottom-5">
      <h2 className="margin-bottom-1 font-sans-lg">
        {t("activeUsersHeading")}
      </h2>
      <p className="margin-bottom-2 margin-top-1">
        {t("activeUsersTableDescription")}
      </p>

      {hasError ? (
        <Alert slim headingLevel="h6" noIcon type="error">
          {t("activeUsersFetchError")}
        </Alert>
      ) : userData.length === 0 ? (
        <p data-testid="active-users-empty">{t("activeUsersTableZeroState")}</p>
      ) : (
        <TableWithResponsiveHeader
          headerContent={tableHeaders}
          tableRowData={transformTableRowData(userData)}
        />
      )}
    </section>
  );
}
