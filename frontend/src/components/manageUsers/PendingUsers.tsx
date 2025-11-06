"use client";

import type { UserDetail } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import React from "react";
import { Table } from "@trussworks/react-uswds";

export interface UsersTableProps {
  tableDescription: string;
  tableTitle: string;
  users: UserDetail[];
}

function formatFullName(user: UserDetail): string {
  const middleName = user.middle_name ? ` ${user.middle_name}` : "";
  const lastName = user.last_name ? ` ${user.last_name}` : "";
  return `${user.first_name}${middleName}${lastName}`.trim();
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
              <tr key={user.user_id}>
                <td>{formatFullName(user)}</td>
                <td>{user.email}</td>
                <td>{user.roles ? user.roles[0].role_name : "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </section>
  );
}
