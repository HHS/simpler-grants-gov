import type { FetchedResource } from "src/types/authTypes";
import type { OrganizationPendingInvitation } from "src/types/userTypes";
import { formatRoleNames } from "src/utils/formatRoleName";
import { formatFullName } from "src/utils/userNameUtils";

import { getTranslations } from "next-intl/server";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";

interface InvitedUsersSectionProps {
  invitedUsers: FetchedResource;
}

export async function InvitedUsersSection({
  invitedUsers,
}: InvitedUsersSectionProps) {
  const t = await getTranslations("ManageUsers");

  const invitedUsersData = invitedUsers.data as
    | OrganizationPendingInvitation[]
    | undefined;
  const invitedUsersError = invitedUsers.error;

  if (invitedUsersError || !invitedUsersData) {
    return (
      <GridContainer className="padding-top-2 tablet:padding-y-6">
        <ErrorMessage>{t("invitedUsersFetchError")}</ErrorMessage>
      </GridContainer>
    );
  }

  const tableHeaders: TableCellData[] = [
    { cellData: t("usersTable.nameHeading") },
    { cellData: t("usersTable.emailHeading") },
    { cellData: t("usersTable.roleHeading") },
  ];

  const transformTableRowData = (
    invitations: OrganizationPendingInvitation[],
  ) =>
    invitations.map((invitation) => {
      const name = invitation.invitee_user
        ? formatFullName(invitation.invitee_user)
        : "";

      return [
        { cellData: name },
        { cellData: invitation.invitee_email },
        { cellData: formatRoleNames(invitation.roles) },
      ];
    });

  return (
    <section className="usa-table-container--scrollable margin-bottom-5 margin-top-5">
      <h2 className="margin-bottom-1 font-sans-lg">
        {t("invitedUsersHeading")}
      </h2>
      <p className="margin-bottom-2 margin-top-1 maxw-full">
        {t("invitedUsersTableDescription")}
      </p>

      {invitedUsersData.length === 0 ? (
        <p data-testid="pending-users-empty" className="maxw-full">
          {t("invitedUsersTableZeroState")}
        </p>
      ) : (
        <TableWithResponsiveHeader
          headerContent={tableHeaders}
          tableRowData={transformTableRowData(invitedUsersData)}
        />
      )}
    </section>
  );
}
