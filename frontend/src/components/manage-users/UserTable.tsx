"use client";

import type { UserDetail, UserRole } from "src/types/userTypes";

import React, { useMemo, useState } from "react";
import { Table } from "@trussworks/react-uswds";
import { useTranslations } from "next-intl";

export interface UsersTableProps {
  roles: UserRole[];
  tableDescription: string;
  tableTitle: string;
  users: UserDetail[];
  onRequestRoleChange: (userId: string, nextRoleId: string) => void;
  busyUserId?: string;
  isSubmitting?: boolean;
}

type SortKey = "name" | "email" | "roles";
type SortDirection = "ascending" | "descending";

function formatFullName(user: UserDetail): string {
  const middleName = user.middle_name ? ` ${user.middle_name}` : "";
  const lastName = user.last_name ? ` ${user.last_name}` : "";
  return `${user.first_name}${middleName}${lastName}`.trim();
}

function roleListText(user: UserDetail): string {
  return (user.roles ?? []).map((role) => role.role_name).join(", ") || "—";
}

function getRoleId(role: UserRole): string {
  return (role as { role_id: string }).role_id;
}

function currentRoleIdForUser(user: UserDetail, allRoles: UserRole[]): string {
  const currentRoleName = user.roles?.[0]?.role_name ?? "";
  const match = allRoles.find((role) => role.role_name === currentRoleName);
  return match ? getRoleId(match) : "";
}

export function UsersTable({
  roles,
  tableDescription,
  tableTitle,
  users,
  onRequestRoleChange,
  busyUserId,
  isSubmitting,
}: UsersTableProps) {
  const t = useTranslations("ManageUsers.usersTable")
  const [sortState, setSortState] = useState<{
    key: SortKey | null;
    direction: SortDirection;
  }>({
    key: null,
    direction: "ascending",
  });

  function handleSort(nextKey: SortKey): void {
    setSortState((previousState) => {
      if (previousState.key !== nextKey) {
        return { key: nextKey, direction: "ascending" };
      }
      if (previousState.direction === "ascending") {
        return { key: nextKey, direction: "descending" };
      }
      return { key: null, direction: "ascending" };
    });
  }

  const sortedUsers = useMemo(() => {
    if (sortState.key === null) return users;
    const copy = [...users];
    copy.sort((firstUser, secondUser) => {
      let firstValue = "";
      let secondValue = "";
      if (sortState.key === "name") {
        firstValue = formatFullName(firstUser).toLowerCase();
        secondValue = formatFullName(secondUser).toLowerCase();
      } else if (sortState.key === "email") {
        firstValue = (firstUser.email ?? "").toLowerCase();
        secondValue = (secondUser.email ?? "").toLowerCase();
      } else {
        firstValue = roleListText(firstUser).toLowerCase();
        secondValue = roleListText(secondUser).toLowerCase();
      }
      if (firstValue < secondValue)
        return sortState.direction === "ascending" ? -1 : 1;
      if (firstValue > secondValue)
        return sortState.direction === "ascending" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [users, sortState]);

  function renderSortArrow(key: SortKey): string {
    if (sortState.key === null || key !== sortState.key) return "↕";
    return sortState.direction === "ascending" ? "▲" : "▼";
  }

  function getAriaSort(key: SortKey): React.AriaAttributes["aria-sort"] {
    if (sortState.key === null || key !== sortState.key) return "none";
    return sortState.direction === "ascending" ? "ascending" : "descending";
  }

  return (
    <section className="usa-table-container--scrollable margin-bottom-5">
      <h2 className="margin-bottom-1 font-sans-lg">{tableTitle}</h2>
      <p className="margin-bottom-2 margin-top-1">{tableDescription}</p>

      <Table className="width-full overflow-wrap simpler-application-forms-table">
        <thead>
          <tr>
            <th
              scope="col"
              className="bg-base-lightest padding-y-205"
              aria-sort={getAriaSort("name")}
            >
              <button
                type="button"
                className="usa-button usa-button--unstyled display-flex flex-align-center font-sans-2xs text-bold text-no-underline text-gray-90"
                onClick={() => handleSort("name")}
              >
                <span className="margin-right-05">{t("nameHeading")}</span>
                <span aria-hidden>{renderSortArrow("name")}</span>
              </button>
            </th>
            <th
              scope="col"
              className="bg-base-lightest padding-y-205"
              aria-sort={getAriaSort("email")}
            >
              <button
                type="button"
                className="usa-button usa-button--unstyled display-flex flex-align-center font-sans-2xs text-bold text-no-underline text-gray-90"
                onClick={() => handleSort("email")}
              >
                <span className="margin-right-05">{t("emailHeading")}</span>
                <span aria-hidden>{renderSortArrow("email")}</span>
              </button>
            </th>
            <th scope="col" className="bg-base-lightest padding-y-205">
              <span className="display-flex flex-align-center font-sans-2xs text-bold text-no-underline text-gray-90">
                {t("roleHeading")}
              </span>
            </th>
          </tr>
        </thead>

        <tbody className="text-gray-90 font-sans-2xs">
          {sortedUsers.length === 0 ? (
            <tr>
              <td colSpan={3}>{t("noUsersFound")}</td>
            </tr>
          ) : (
            sortedUsers.map((user) => (
              <tr key={user.user_id}>
                <td>{formatFullName(user)}</td>
                <td>{user.email}</td>
                <td>
                  <fieldset className="usa-fieldset margin-0">
                    <legend className="usa-sr-only">
                      {t("selectRoleFor")} {formatFullName(user)}
                    </legend>
                    <div className="display-flex flex-wrap grid-gap-2">
                      {roles.map((role) => {
                        const roleId = getRoleId(role);
                        const isChecked =
                          currentRoleIdForUser(user, roles) === roleId;
                        return (
                          <label
                            className="usa-radio margin-right-205"
                            key={`${user.user_id}-${roleId}`}
                          >
                            <input
                              className="usa-radio__input"
                              type="radio"
                              name={`edit-role-${user.user_id}`}
                              value={roleId}
                              checked={isChecked}
                              onChange={() =>
                                onRequestRoleChange(user.user_id, roleId)
                              }
                              disabled={Boolean(
                                isSubmitting && busyUserId === user.user_id,
                              )}
                            />
                            <span className="usa-radio__label font-sans-2xs text-gray-90 margin-top-0">
                              {role.role_name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </section>
  );
}
