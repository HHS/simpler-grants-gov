import { UnauthorizedError } from "src/errors";
import { getOrganizationPendingInvitations } from "src/services/fetch/fetchers/organizationsFetcher";
import type {
  InvitationUser,
  OrganizationPendingInvitation,
} from "src/types/userTypes";

import { useTranslations } from "next-intl";
import React from "react";
import { Alert } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";

function formatFullName(user: InvitationUser | null): string {
  if (!user) return "-";

  const parts = [user.first_name, user.last_name].filter(Boolean);

  return parts.join(" ");
}

interface PendingUsersSectionProps {
  organizationId: string;
}

export async function PendingUsersSection({
  organizationId,
}: PendingUsersSectionProps) {
  const t = useTranslations("ManageUsers");
  let pendingUsers: OrganizationPendingInvitation[] = [];
  let hasError = false;

  try {
    pendingUsers = await getOrganizationPendingInvitations(organizationId);
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

  const transformTableRowData = (
    userDetails: OrganizationPendingInvitation[],
  ) => {
    return userDetails.map((user) => {
      return [
        { cellData: <>{formatFullName(user.invitee_user)}</> },
        { cellData: <>{user.invitee_email}</> },
        { cellData: <>{user.roles[0].role_name}</> },
      ];
    });
  };

  return (
    <section className="usa-table-container--scrollable margin-bottom-5">
      <h2 className="margin-bottom-1 font-sans-lg">
        {t("pendingUsersHeading")}
      </h2>
      <p className="margin-bottom-2 margin-top-1">
        {t("pendingUsersTableDescription")}
      </p>

      {hasError ? (
        <Alert slim headingLevel="h6" noIcon type="error">
          {t("PendingUsersFetchError")}
        </Alert>
      ) : (
        <TableWithResponsiveHeader
          headerContent={tableHeaders}
          tableRowData={transformTableRowData(pendingUsers)}
        />
      )}
    </section>
  );
}
