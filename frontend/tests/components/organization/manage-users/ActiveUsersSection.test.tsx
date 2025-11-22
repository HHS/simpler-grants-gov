import { render, screen } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import type { AuthorizedData, FetchedResource } from "src/types/authTypes";
import type { UserDetail, UserRole } from "src/types/userTypes";

import { ActiveUsersSection } from "src/components/manageUsers/ActiveUsersSection";

type TranslationFn = (key: string) => string;

const getTranslationsMock = jest.fn<Promise<TranslationFn>, [string]>(
  (_ns: string) => Promise.resolve((key: string) => key),
);

jest.mock("next-intl/server", () => ({
  getTranslations: (ns: string) => getTranslationsMock(ns),
}));

const tableWithResponsiveHeaderMock = jest.fn<void, [unknown]>();

jest.mock("src/components/TableWithResponsiveHeader", () => ({
  TableWithResponsiveHeader: (props: unknown) => {
    tableWithResponsiveHeaderMock(props);
    return <div data-testid="active-users-table" />;
  },
}));

describe("ActiveUsersSection", () => {
  const makeAuthorizedData = (
    activeUsersList: FetchedResource,
  ): AuthorizedData => ({
    fetchedResources: {
      activeUsersList,
    },
    confirmedPrivileges: [],
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws if authorizedData is missing", async () => {
    await expect(ActiveUsersSection({})).rejects.toThrow(
      "ActiveUsersList must be wrapped in AuthorizationGate",
    );
  });

  it("renders zero-state text when there are no active users", async () => {
    const authorizedData = makeAuthorizedData({
      data: [] as UserDetail[],
      statusCode: 200,
    });

    const component = await ActiveUsersSection({ authorizedData });
    render(component);

    expect(await screen.findByTestId("active-users-empty")).toHaveTextContent(
      "activeUsersTableZeroState",
    );
  });

  it("renders an error message when there is an error or no data", async () => {
    const authorizedData = makeAuthorizedData({
      data: undefined,
      statusCode: 500,
      error: "something went wrong",
    });

    const component = await ActiveUsersSection({ authorizedData });
    render(component);

    expect(await screen.findByText("activeUsersFetchError")).toBeVisible();
  });

  it("renders a table with formatted name, email, and roles when active users exist", async () => {
    const roles: UserRole[] = [
      {
        role_id: "role-1",
        role_name: "Admin",
        privileges: [],
      },
    ];

    const users: UserDetail[] = [
      {
        user_id: "user-1",
        email: "ada@example.com",
        first_name: "Ada",
        middle_name: undefined,
        last_name: "Lovelace",
        roles,
      },
    ];

    const authorizedData = makeAuthorizedData({
      data: users,
      statusCode: 200,
    });

    const component = await ActiveUsersSection({ authorizedData });
    render(component);

    expect(await screen.findByTestId("active-users-table")).toBeVisible();

    expect(tableWithResponsiveHeaderMock).toHaveBeenCalledTimes(1);

    const tableProps = tableWithResponsiveHeaderMock.mock.calls[0][0] as {
      headerContent: { cellData: string }[];
      tableRowData: { cellData: unknown }[][];
    };

    expect(tableProps.headerContent.map((h) => h.cellData)).toEqual([
      "usersTable.nameHeading",
      "usersTable.emailHeading",
      "usersTable.roleHeading",
    ]);

    const row = tableProps.tableRowData[0];

    expect(row[0].cellData).toBe("Ada Lovelace");
    expect(row[1].cellData).toBe("ada@example.com");
    expect(row[2].cellData).toBe("Admin");
  });
});
