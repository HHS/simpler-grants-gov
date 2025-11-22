import { AuthorizedData } from "src/types/authTypes";
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
  authorizedData?: AuthorizedData;
}

export async function InvitedUsersSection({
  authorizedData,
}: InvitedUsersSectionProps) {
  const t = await getTranslations("ManageUsers");
  let invitedUsers: OrganizationPendingInvitation[] = [];

  if (!authorizedData) {
    throw new Error("ActiveUsersList must be wrapped in AuthorizationGate");
  }

  const { fetchedResources } = authorizedData;
  const {
    invitedUsersList: { data, error },
  } = fetchedResources;

  if (error || !data) {
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

  invitedUsers = data as OrganizationPendingInvitation[];

  const transformTableRowData = (
    userDetails: OrganizationPendingInvitation[],
  ) => {
    return userDetails.map((user) => {
      return [
        { cellData: formatFullName(user.invitee_user) },
        { cellData: user.invitee_email },
        { cellData: formatRoleNames(user.roles) },
      ];
    });
  };

  return (
    <section className="usa-table-container--scrollable margin-bottom-5 margin-top-5">
      <h2 className="margin-bottom-1 font-sans-lg">
        {t("invitedUsersHeading")}
      </h2>
      <p className="margin-bottom-2 margin-top-1 maxw-full">
        {t("invitedUsersTableDescription")}
      </p>

      {invitedUsers.length === 0 ? (
        <p data-testid="pending-users-empty" className="maxw-full">
          {t("invitedUsersTableZeroState")}
        </p>
      ) : (
        <TableWithResponsiveHeader
          headerContent={tableHeaders}
          tableRowData={transformTableRowData(invitedUsers)}
        />
      )}
    </section>
  );
}
