/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import { UnauthorizedError } from "src/errors";
import type { OrganizationPendingInvitation } from "src/types/userTypes";

import { InvitedUsersSection } from "src/components/manageUsers/InvitedUsersSection";

type TranslationFn = (key: string) => string;

const getTranslationsMock = jest.fn<Promise<TranslationFn>, [string]>(
  (_ns: string) => Promise.resolve((key: string) => key),
);

jest.mock("next-intl/server", () => ({
  getTranslations: (ns: string) => getTranslationsMock(ns),
}));

type GetPendingInvitationsFn = (
  organizationId: string,
) => Promise<OrganizationPendingInvitation[]>;

const getOrganizationPendingInvitationsMock: jest.MockedFunction<GetPendingInvitationsFn> =
  jest.fn<Promise<OrganizationPendingInvitation[]>, [string]>(
    (_orgId: string) => Promise.resolve([] as OrganizationPendingInvitation[]),
  );

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationPendingInvitations: (
    ...args: Parameters<GetPendingInvitationsFn>
  ) => getOrganizationPendingInvitationsMock(...args),
}));

const tableWithResponsiveHeaderMock = jest.fn<void, [unknown]>();

jest.mock("src/components/TableWithResponsiveHeader", () => ({
  TableWithResponsiveHeader: (props: unknown) => {
    tableWithResponsiveHeaderMock(props);
    return <div data-testid="invited-users-table" />;
  },
}));

describe("InvitedUsersSection", () => {
  const organizationId = "org-123";

  beforeEach(() => {
    jest.clearAllMocks();
    getOrganizationPendingInvitationsMock.mockResolvedValue(
      [] as OrganizationPendingInvitation[],
    );
  });

  it("renders zero-state text when there are no pending invitations", async () => {
    getOrganizationPendingInvitationsMock.mockResolvedValueOnce(
      [] as OrganizationPendingInvitation[],
    );

    const component = await InvitedUsersSection({ organizationId });
    render(component);

    expect(await screen.findByTestId("pending-users-empty")).toHaveTextContent(
      "invitedUsersTableZeroState",
    );
  });

  it("renders an error alert when there is a non-UnauthorizedError", async () => {
    getOrganizationPendingInvitationsMock.mockRejectedValueOnce(
      new Error("some failure"),
    );

    const component = await InvitedUsersSection({ organizationId });
    render(component);

    expect(await screen.findByText("invitedUsersFetchError")).toBeVisible();
  });

  it("rethrows UnauthorizedError so it can be handled upstream", async () => {
    getOrganizationPendingInvitationsMock.mockRejectedValueOnce(
      new UnauthorizedError("No active session"),
    );

    await expect(
      InvitedUsersSection({ organizationId }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("renders a table with formatted name, email, and roles when pending invitations exist", async () => {
    const pending = [
      {
        invitation_id: "inv-1",
        invitee_email: "ada@example.com",
        invitee_user: { first_name: "Ada", last_name: "Lovelace" },
        roles: [{ role_name: "Admin" }],
      },
    ];

    getOrganizationPendingInvitationsMock.mockResolvedValueOnce(
      pending as unknown as OrganizationPendingInvitation[],
    );

    const component = await InvitedUsersSection({ organizationId });
    render(component);

    expect(await screen.findByTestId("invited-users-table")).toBeVisible();

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
