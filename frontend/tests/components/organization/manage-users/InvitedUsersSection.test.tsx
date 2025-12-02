import { render, screen } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import type { FetchedResource } from "src/types/authTypes";
import {
  OrganizationInvitationStatus,
  type OrganizationPendingInvitation,
} from "src/types/userTypes";

import { InvitedUsersSection } from "src/components/manageUsers/InvitedUsersSection";

type TranslationFn = (key: string) => string;

const getTranslationsMock = jest.fn<Promise<TranslationFn>, [string]>(
  (_namespace: string) => Promise.resolve((key: string) => key),
);

jest.mock("next-intl/server", () => ({
  getTranslations: (ns: string) => getTranslationsMock(ns),
}));

const tableWithResponsiveHeaderMock = jest.fn<void, [unknown]>();

jest.mock("src/components/TableWithResponsiveHeader", () => ({
  TableWithResponsiveHeader: (props: unknown) => {
    tableWithResponsiveHeaderMock(props);
    return <div data-testid="invited-users-table" />;
  },
}));

const makeInvitedUsersResource = (
  overrides: Partial<FetchedResource> = {},
): FetchedResource => ({
  data: [] as OrganizationPendingInvitation[],
  statusCode: 200,
  ...overrides,
});

describe("InvitedUsersSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders zero-state text when there are no pending invitations", async () => {
    const invitedUsers = makeInvitedUsersResource({
      data: [] as OrganizationPendingInvitation[],
    });

    const component = await InvitedUsersSection({ invitedUsers });
    render(component);

    expect(await screen.findByTestId("pending-users-empty")).toHaveTextContent(
      "invitedUsersTableZeroState",
    );
  });

  it("renders an error message when there is an error or no data", async () => {
    const invitedUsers = makeInvitedUsersResource({
      data: undefined,
      statusCode: 500,
      error: "something went wrong",
    });

    const component = await InvitedUsersSection({ invitedUsers });
    render(component);

    expect(await screen.findByText("invitedUsersFetchError")).toBeVisible();
  });

  it("renders a table with formatted name, email, and roles when pending invitations exist", async () => {
    const pending: OrganizationPendingInvitation[] = [
      {
        organization_invitation_id: "inv-1",
        status: OrganizationInvitationStatus.Pending,
        created_at: "2025-01-01T00:00:00Z",
        expires_at: "2025-02-01T00:00:00Z",
        accepted_at: null,
        rejected_at: null,
        invitee_email: "ada@example.com",
        invitee_user: {
          user_id: "user-1",
          email: "ada@example.com",
          first_name: "Ada",
          last_name: "Lovelace",
        },
        inviter_user: {
          user_id: "inviter-1",
          email: "inviter@example.com",
          first_name: "Grace",
          last_name: "Hopper",
        },
        roles: [{ role_id: "role-1", role_name: "Admin", privileges: [] }],
      },
    ];

    const invitedUsers = makeInvitedUsersResource({
      data: pending,
    });

    const component = await InvitedUsersSection({ invitedUsers });
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
