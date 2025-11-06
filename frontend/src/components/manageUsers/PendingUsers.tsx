"use client";

import type {
  OrganizationPendingInvitation,
} from "src/types/userTypes";

import { useTranslations } from "next-intl";
import React from "react";
import { Table } from "@trussworks/react-uswds";

export interface UsersTableProps {
  tableDescription: string;
  tableTitle: string;
  users: OrganizationPendingInvitation[];
}

function formatUserName(user?: { first_name?: string | null; last_name?: string | null } | null): string {
  if (!user) return "-";
  const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return name || "-";
}

export function PendingUsers({
  tableDescription,
  tableTitle,
  users,
}: UsersTableProps) {
  const t = useTranslations("ManageUsers.usersTable");

  return (
    <section className="usa-table-container--scrollable margin-bottom-5">
      <h2 className="margin-bottom-1 font-sans-lg">{tableTitle}</h2>
      <p className="margin-bottom-2 margin-top-1">{tableDescription}</p>

      <Table className="width-full overflow-wrap simpler-application-forms-table">
        <thead>
          <tr>
            <th scope="col" className="bg-base-lightest padding-y-205">
              {t("nameHeading")}
            </th>
            <th scope="col" className="bg-base-lightest padding-y-205">
              {t("emailHeading")}
            </th>
            <th scope="col" className="bg-base-lightest padding-y-205">
              <span className="display-flex flex-align-center font-sans-2xs text-bold text-no-underline text-gray-90">
                {t("roleHeading")}
              </span>
            </th>
          </tr>
        </thead>

        <tbody className="text-gray-90 font-sans-2xs">
          {users.length === 0 ? (
            <tr>
              <td colSpan={3}>{t("noUsersFound")}</td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.organization_invitation_id}>
                <td>{formatUserName(user.invitee_user)}</td>
                <td>{user.invitee_email}</td>
                <td>{user.roles ? user.roles[0].role_name : "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </section>
  );
}
