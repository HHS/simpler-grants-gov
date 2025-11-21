import { AuthorizedData } from "src/types/authTypes";
import type { UserDetail } from "src/types/userTypes";
import { formatRoleNames } from "src/utils/formatRoleName";
import { formatFullName } from "src/utils/userNameUtils";

import { getTranslations } from "next-intl/server";
import React from "react";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";

interface ActiveUsersSectionProps {
  authorizedData?: AuthorizedData;
}

export async function ActiveUsersSection({
  authorizedData,
}: ActiveUsersSectionProps) {
  const t = await getTranslations("ManageUsers");
  let userData: UserDetail[] = [];

  if (!authorizedData) {
    throw new Error("ActiveUsersList must be wrapped in AuthorizationGate");
  }

  const { fetchedResources } = authorizedData;
  const {
    activeUsersList: { data, error },
  } = fetchedResources;

  if (error || !data) {
    return (
      <GridContainer className="padding-top-2 tablet:padding-y-6">
        <ErrorMessage>{t("activeUsersFetchError")}</ErrorMessage>
      </GridContainer>
    );
  }

  userData = data as UserDetail[];

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

      {userData.length === 0 ? (
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
