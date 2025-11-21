import { render, screen } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import { UnauthorizedError } from "src/errors";
import type { UserDetail } from "src/types/userTypes";

import { ActiveUsersSection } from "src/components/manageUsers/ActiveUsersSection";

type TranslationFn = (key: string) => string;

const getTranslationsMock = jest.fn<Promise<TranslationFn>, [string]>(
  (_ns: string) => Promise.resolve((key: string) => key),
);

jest.mock("next-intl/server", () => ({
  getTranslations: (ns: string) => getTranslationsMock(ns),
}));

type GetOrgUsersFn = (organizationId: string) => Promise<UserDetail[]>;

const getOrganizationUsersMock: jest.MockedFunction<GetOrgUsersFn> = jest.fn<
  Promise<UserDetail[]>,
  [string]
>((_orgId: string) => Promise.resolve([] as UserDetail[]));

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationUsers: (...args: Parameters<GetOrgUsersFn>) =>
    getOrganizationUsersMock(...args),
}));

const tableWithResponsiveHeaderMock = jest.fn<
  void,
  [
    {
      headerContent: { cellData: string }[];
      tableRowData: { cellData: unknown }[][];
    },
  ]
>();

jest.mock("src/components/TableWithResponsiveHeader", () => ({
  TableWithResponsiveHeader: (props: unknown) => {
    tableWithResponsiveHeaderMock(
      props as {
        headerContent: { cellData: string }[];
        tableRowData: { cellData: unknown }[][];
      },
    );
    return <div data-testid="active-users-table" />;
  },
}));

describe("ActiveUsersSection", () => {
  const organizationId = "org-123";

  beforeEach(() => {
    jest.clearAllMocks();
    getOrganizationUsersMock.mockResolvedValue([] as UserDetail[]);
  });

  it("renders zero-state text when there are no active users", async () => {
    getOrganizationUsersMock.mockResolvedValueOnce([] as UserDetail[]);

    const component = await ActiveUsersSection({ organizationId });
    render(component);

    expect(await screen.findByTestId("active-users-empty")).toHaveTextContent(
      "activeUsersTableZeroState",
    );
  });

  it("renders an error alert when there is a non-UnauthorizedError", async () => {
    getOrganizationUsersMock.mockRejectedValueOnce(new Error("some failure"));

    const component = await ActiveUsersSection({ organizationId });
    render(component);

    expect(await screen.findByText("activeUsersFetchError")).toBeVisible();
  });

  it("rethrows UnauthorizedError so it can be handled upstream", async () => {
    getOrganizationUsersMock.mockRejectedValueOnce(
      new UnauthorizedError("No active session"),
    );

    await expect(ActiveUsersSection({ organizationId })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("renders a table with formatted name, email, and roles when active users exist", async () => {
    const users = [
      {
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com",
        roles: [{ role_name: "Admin" }],
      },
    ];

    getOrganizationUsersMock.mockResolvedValueOnce(
      users as unknown as UserDetail[],
    );

    const component = await ActiveUsersSection({ organizationId });
    render(component);

    expect(await screen.findByTestId("active-users-table")).toBeVisible();

    expect(tableWithResponsiveHeaderMock).toHaveBeenCalledTimes(1);

    const tableProps = tableWithResponsiveHeaderMock.mock.calls[0][0];

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
