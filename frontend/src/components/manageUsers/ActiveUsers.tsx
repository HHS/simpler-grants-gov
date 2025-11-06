"use client";

import type { UserDetail, UserRole } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import React from "react";
import { ErrorMessage, Table } from "@trussworks/react-uswds";

export interface UsersTableProps {
  roles: UserRole[];
  tableDescription: string;
  tableTitle: string;
  users: UserDetail[];
  busyUserId?: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  onRequestRoleChange: (userId: string, nextRoleId: string) => void;
}

function formatFullName(user: UserDetail): string {
  if (!user || !user.first_name) return "-";

  const parts = [user.first_name, user.middle_name, user.last_name].filter(
    Boolean,
  );

  return parts.length > 0 ? parts.join(" ") : "-";
}

function getRoleId(role: UserRole): string {
  return (role as { role_id: string }).role_id;
}

function currentRoleIdForUser(user: UserDetail, allRoles: UserRole[]): string {
  const currentRoleName = user.roles?.[0]?.role_name ?? "";
  const match = allRoles.find((role) => role.role_name === currentRoleName);
  return match ? getRoleId(match) : "";
}

export function ActiveUsers({
  roles,
  tableDescription,
  tableTitle,
  users,
  busyUserId,
  isSubmitting,
  errorMessage,
  onRequestRoleChange,
}: UsersTableProps) {
  const translatedText = useTranslations("ManageUsers.usersTable");

  return (
    <section className="usa-table-container--scrollable margin-bottom-5">
      <h2 className="margin-bottom-1 font-sans-lg">{tableTitle}</h2>
      <p className="margin-bottom-2 margin-top-1">{tableDescription}</p>

      {errorMessage ? (
        <div className="margin-bottom-2">
          <ErrorMessage>{errorMessage}</ErrorMessage>
        </div>
      ) : null}

      <Table className="width-full overflow-wrap simpler-application-forms-table">
        <thead>
          <tr>
            <th scope="col" className="bg-base-lightest padding-y-205">
              {translatedText("nameHeading")}
            </th>
            <th scope="col" className="bg-base-lightest padding-y-205">
              {translatedText("emailHeading")}
            </th>
            <th scope="col" className="bg-base-lightest padding-y-205">
              <span className="display-flex flex-align-center font-sans-2xs text-bold text-no-underline text-gray-90">
                {translatedText("roleHeading")}
              </span>
            </th>
          </tr>
        </thead>

        <tbody className="text-gray-90 font-sans-2xs">
          {users.length === 0 ? (
            <tr>
              <td colSpan={3}>{translatedText("noUsersFound")}</td>
            </tr>
          ) : (
            users.map((user, index) => {
              const currentRoleId = currentRoleIdForUser(user, roles);
              const isUserBusy =
                Boolean(isSubmitting) && busyUserId === user.user_id;

              return (
                <tr key={`${user.user_id ?? "no-id"}-${index}`}>
                  <td>{formatFullName(user)}</td>
                  <td>{user.email}</td>
                  <td>
                    <label
                      className="usa-sr-only"
                      htmlFor={`role-select-${user.user_id}`}
                    >
                      {translatedText("selectRoleFor")} {formatFullName(user)}
                    </label>
                    <select
                      id={`role-select-${user.user_id}`}
                      className="usa-select font-sans-2xs text-gray-90"
                      value={currentRoleId}
                      onChange={(event) =>
                        onRequestRoleChange(user.user_id, event.target.value)
                      }
                      disabled={isUserBusy}
                    >
                      {roles.map((role) => {
                        const roleId = getRoleId(role);
                        return (
                          <option key={roleId} value={roleId}>
                            {role.role_name}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </section>
  );
}
