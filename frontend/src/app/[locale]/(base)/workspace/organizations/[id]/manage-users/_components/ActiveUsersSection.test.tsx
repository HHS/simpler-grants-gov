import { render, screen } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import { ActiveUsersSection } from "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/_components/ActiveUsersSection";
import { ORG_COLLABORATOR_ROLE_ID } from "src/constants/roles";
import type { FetchedResource } from "src/types/authTypes";
import type { UserDetail, UserRole } from "src/types/userTypes";

type TranslationFn = (key: string, values?: Record<string, string>) => string;

// Returns the key, plus any values, so tests can check what was passed in
const getTranslationsMock = jest.fn<Promise<TranslationFn>, [string]>(
  (_namespace: string) =>
    Promise.resolve((key: string, values?: Record<string, string>) =>
      values ? `${key} ${Object.values(values).join(" ")}` : key,
    ),
);

jest.mock("next-intl/server", () => ({
  getTranslations: (namespace: string) => getTranslationsMock(namespace),
}));

const tableWithResponsiveHeaderMock = jest.fn<void, [unknown]>();

jest.mock("src/components/core/TableWithResponsiveHeader", () => ({
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

    // Roles fetch fails, so roles are rendered as a disabled dropdown.
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

    const roleCellElement = firstRow[2].cellData as React.ReactElement<{
      organizationId: string;
      userId: string;
      currentRoleId: string;
      roleOptions: Array<{ value: string; label: string }>;
      disabled: boolean;
    }>;

    expect(roleCellElement).toBeTruthy();
    expect(roleCellElement.type).toBeDefined();
    expect(roleCellElement.props.organizationId).toBe("org-123");
    expect(roleCellElement.props.userId).toBe("user-1");
    expect(roleCellElement.props.currentRoleId).toBe("role-1");
    expect(roleCellElement.props.roleOptions).toEqual([]);
    expect(roleCellElement.props.disabled).toBe(true);

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

  it("disables row when user has is_ebiz_poc set to true", async () => {
    const roles: UserRole[] = [
      {
        role_id: "role-1",
        role_name: "Admin",
        privileges: [],
      },
      {
        role_id: "role-2",
        role_name: "Member",
        privileges: [],
      },
    ];

    const users: (UserDetail & { is_ebiz_poc?: boolean })[] = [
      {
        user_id: "user-1",
        email: "ebiz@example.com",
        first_name: "Ebiz",
        middle_name: undefined,
        last_name: "POC",
        roles: [roles[0]],
        is_ebiz_poc: true,
      },
    ];

    const activeUsers = makeResource({
      data: users,
      statusCode: 200,
    });

    const rolesResource = makeResource({
      data: roles,
      statusCode: 200,
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
      tableRowData: Array<Array<{ cellData: unknown; className?: string }>>;
    };

    const firstRow = tableProps.tableRowData[0];

    // Check that all cells have the text-base-dark className for greyed out text
    expect(firstRow[0].className).toBe("text-base-dark");
    expect(firstRow[1].className).toBe("text-base-dark");
    expect(firstRow[2].className).toBe("text-base-dark");
    expect(firstRow[3].className).toBe("text-base-dark");

    // Check that RoleManager is disabled
    const roleCellElement = firstRow[2].cellData as React.ReactElement<{
      organizationId: string;
      userId: string;
      currentRoleId: string;
      roleOptions: Array<{ value: string; label: string }>;
      disabled: boolean;
    }>;

    expect(roleCellElement).toBeTruthy();
    expect(roleCellElement.props.disabled).toBe(true);

    // Check that RemoveUserButton is disabled
    const actionsCellElement = firstRow[3].cellData as React.ReactElement<{
      organizationId: string;
      userId: string;
      userName: string;
      disabled: boolean;
    }>;

    expect(actionsCellElement).toBeTruthy();
    expect(actionsCellElement.props.disabled).toBe(true);
  });
  describe("manage permissions column", () => {
    const adminRole: UserRole = {
      role_id: "admin-role",
      role_name: "Organization Admin",
      privileges: [],
    };
    const collaboratorRole: UserRole = {
      role_id: ORG_COLLABORATOR_ROLE_ID,
      role_name: "Collaborator",
      privileges: [],
    };
    const users: UserDetail[] = [
      {
        user_id: "admin-1",
        email: "admin@example.com",
        first_name: "Ada",
        last_name: "Admin",
        roles: [adminRole],
      },
      {
        user_id: "collab-1",
        email: "collab@example.com",
        first_name: "Cole",
        last_name: "Collab",
        roles: [collaboratorRole],
      },
    ];

    type TableProps = {
      headerContent: { cellData: string }[];
      tableRowData: { cellData: React.ReactNode }[][];
    };

    const getTableProps = async (showManagePermissions?: boolean) => {
      render(
        await ActiveUsersSection({
          organizationId: "org-123",
          activeUsers: makeResource({ data: users }),
          roles: makeResource({ data: [adminRole] }),
          showManagePermissions,
        }),
      );
      return tableWithResponsiveHeaderMock.mock.calls[0][0] as TableProps;
    };

    it("is hidden by default", async () => {
      const tableProps = await getTableProps();

      expect(
        tableProps.headerContent.map((header) => header.cellData),
      ).not.toContain("usersTable.managePermissionsHeading");
      expect(tableProps.tableRowData[1]).toHaveLength(4);
    });

    it("adds the column before Actions when enabled", async () => {
      const tableProps = await getTableProps(true);

      expect(tableProps.headerContent.map((header) => header.cellData)).toEqual(
        [
          "usersTable.nameHeading",
          "usersTable.emailHeading",
          "usersTable.roleHeading",
          "usersTable.managePermissionsHeading",
          "usersTable.actionsHeading",
        ],
      );
      expect(tableProps.tableRowData[0]).toHaveLength(5);
      expect(tableProps.tableRowData[1]).toHaveLength(5);
    });

    it("links Collaborator rows to their manage-permissions page", async () => {
      const tableProps = await getTableProps(true);

      render(<>{tableProps.tableRowData[1][3].cellData}</>);

      const link = screen.getByTestId("manage-permissions-link-collab-1");
      expect(link).toHaveAttribute(
        "href",
        "/workspace/organizations/org-123/manage-users/collab-1/manage-permissions",
      );
      // the visible label is the same on every row, so the user is named for screen readers
      expect(link).toHaveAccessibleName(
        "usersTable.editPermissions usersTable.editPermissionsFor Cole Collab",
      );
    });

    it("doesn't add a link to Admin rows", async () => {
      const tableProps = await getTableProps(true);

      expect(tableProps.tableRowData[0][3].cellData).toBe("");
    });
  });

  describe("external collaborator column", () => {
    const roles: UserRole[] = [
      { role_id: "role-1", role_name: "Admin", privileges: [] },
    ];

    const users: UserDetail[] = [
      {
        user_id: "user-1",
        email: "external@example.com",
        first_name: "Ext",
        last_name: "Ernal",
        roles,
        is_external: true,
      },
      {
        user_id: "user-2",
        email: "staff@example.com",
        first_name: "Staff",
        last_name: "Person",
        roles,
        is_external: false,
      },
    ];

    const loadTableProps = async (
      showExternal?: boolean,
      showManagePermissions?: boolean,
    ) => {
      const component = await ActiveUsersSection({
        organizationId: "org-123",
        activeUsers: makeResource({ data: users }),
        roles: makeResource({ data: roles }),
        showExternal,
        showManagePermissions,
      });
      render(component);
      await screen.findByTestId("active-users-table");
      return tableWithResponsiveHeaderMock.mock.calls[0][0] as {
        headerContent: { cellData: string }[];
        tableRowData: { cellData: unknown }[][];
      };
    };

    it("does not render the External column by default", async () => {
      const tableProps = await loadTableProps();

      expect(
        tableProps.headerContent.map((header) => header.cellData),
      ).not.toContain("usersTable.externalHeading");
      expect(tableProps.tableRowData[0]).toHaveLength(4);
    });

    it("renders the External column as plain text when enabled", async () => {
      const tableProps = await loadTableProps(true);

      expect(tableProps.headerContent.map((header) => header.cellData)).toEqual(
        [
          "usersTable.nameHeading",
          "usersTable.emailHeading",
          "usersTable.roleHeading",
          "usersTable.externalHeading",
          "usersTable.actionsHeading",
        ],
      );

      const [externalRow, staffRow] = tableProps.tableRowData;
      expect(externalRow).toHaveLength(5);

      expect(externalRow[3].cellData).toBe("usersTable.externalLabel");

      expect(staffRow[3].cellData).toBe("");
    });

    it("places Label before Manage permissions and Actions", async () => {
      const tableProps = await loadTableProps(true, true);

      expect(tableProps.headerContent.map((header) => header.cellData)).toEqual(
        [
          "usersTable.nameHeading",
          "usersTable.emailHeading",
          "usersTable.roleHeading",
          "usersTable.externalHeading",
          "usersTable.managePermissionsHeading",
          "usersTable.actionsHeading",
        ],
      );
      expect(tableProps.tableRowData[0]).toHaveLength(6);
      expect(tableProps.tableRowData[0][3].cellData).toBe(
        "usersTable.externalLabel",
      );
    });
  });
});
