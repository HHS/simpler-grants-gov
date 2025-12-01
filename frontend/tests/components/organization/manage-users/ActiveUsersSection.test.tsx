import { render, screen } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import type { FetchedResource } from "src/types/authTypes";
import type { UserDetail, UserRole } from "src/types/userTypes";

import { ActiveUsersSection } from "src/components/manageUsers/ActiveUsersSection";

type TranslationFn = (key: string) => string;

const getTranslationsMock = jest.fn<Promise<TranslationFn>, [string]>(
  (_namespace: string) => Promise.resolve((key: string) => key),
);

jest.mock("next-intl/server", () => ({
  getTranslations: (namespace: string) => getTranslationsMock(namespace),
}));

const tableWithResponsiveHeaderMock = jest.fn<void, [unknown]>();

jest.mock("src/components/TableWithResponsiveHeader", () => ({
  TableWithResponsiveHeader: (props: unknown) => {
    tableWithResponsiveHeaderMock(props);
    return <div data-testid="active-users-table" />;
  },
}));

const makeResource = (
  overrides: Partial<FetchedResource> = {},
): FetchedResource => ({
  data: [],
  statusCode: 200,
  ...overrides,
});

describe("ActiveUsersSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders zero-state text when there are no active users", async () => {
    const activeUsers = makeResource({
      data: [] as UserDetail[],
    });

    const roles = makeResource({
      data: [] as UserRole[],
    });

    const component = await ActiveUsersSection({
      organizationId: "org-123",
      activeUsers,
      roles,
    });
    render(component);

    expect(await screen.findByTestId("active-users-empty")).toHaveTextContent(
      "activeUsersTableZeroState",
    );
  });

  it("renders an error message when there is an error or no data", async () => {
    const activeUsers = makeResource({
      data: undefined,
      statusCode: 500,
      error: "something went wrong",
    });

    const roles = makeResource({
      data: [] as UserRole[],
    });

    const component = await ActiveUsersSection({
      organizationId: "org-123",
      activeUsers,
      roles,
    });
    render(component);

    expect(await screen.findByText("activeUsersFetchError")).toBeVisible();
  });

  it("renders a table with formatted name, email, roles, and actions when active users exist", async () => {
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

    const activeUsers = makeResource({
      data: users,
      statusCode: 200,
    });

    // Roles fetch fails, so roles are rendered as read-only text.
    const rolesResource = makeResource({
      data: [] as UserRole[],
      error: "failed to load roles",
      statusCode: 500,
    });

    const component = await ActiveUsersSection({
      organizationId: "org-123",
      activeUsers,
      roles: rolesResource,
    });
    render(component);

    expect(await screen.findByTestId("active-users-table")).toBeVisible();
    expect(tableWithResponsiveHeaderMock).toHaveBeenCalledTimes(1);

    const tableProps = tableWithResponsiveHeaderMock.mock.calls[0][0] as {
      headerContent: { cellData: string }[];
      tableRowData: { cellData: unknown }[][];
    };

    expect(tableProps.headerContent.map((header) => header.cellData)).toEqual([
      "usersTable.nameHeading",
      "usersTable.emailHeading",
      "usersTable.roleHeading",
      "usersTable.actionsHeading",
    ]);

    const firstRow = tableProps.tableRowData[0];

    expect(firstRow[0].cellData).toBe("Ada Lovelace");
    expect(firstRow[1].cellData).toBe("ada@example.com");
    expect(firstRow[2].cellData).toBe("Admin");

    const actionsCellElement = firstRow[3].cellData as React.ReactElement<{
      organizationId: string;
      userId: string;
      userName: string;
    }>;

    expect(actionsCellElement).toBeTruthy();
    expect(actionsCellElement.props.organizationId).toBe("org-123");
    expect(actionsCellElement.props.userId).toBe("user-1");
    expect(actionsCellElement.props.userName).toBe("Ada Lovelace");
  });
});
