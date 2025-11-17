import { UnauthorizedError } from "src/errors";
import { getOrganizationUsers } from "src/services/fetch/fetchers/organizationsFetcher";
import type { UserDetail, UserRole } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import React from "react";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "../TableWithResponsiveHeader";
import { Alert } from "@trussworks/react-uswds";

function formatFullName(user: UserDetail): string {
  if (!user || !user.first_name) return "-";

  const parts = [user.first_name, user.middle_name, user.last_name].filter(
    Boolean,
  );

  return parts.join(" ");
}

interface ActiveUsersSectionProps {
    organizationId: string;
}

export async function ActiveUsersSection({
  organizationId
}: ActiveUsersSectionProps) {
  const t = useTranslations("ManageUsers");
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
        { cellData: <>{formatFullName(user)}</> },
        { cellData: <>{user.email}</> },
        { cellData: <>{user.roles[0].role_name}</> },
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
      ) : (
        <TableWithResponsiveHeader
          headerContent={tableHeaders}
          tableRowData={transformTableRowData(userData)}
        />
      )}
    </section>
  );
}
