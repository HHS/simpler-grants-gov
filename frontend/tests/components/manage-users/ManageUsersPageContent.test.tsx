/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import type { Organization } from "src/types/applicationResponseTypes";
import type { UserDetail, UserRole } from "src/types/userTypes";
import { ManageUsersPageContent } from "src/components/manage-users/ManageUsersPageContent";

type Session = { token: string; user_id: string; email?: string };
const getSessionMock = jest.fn<Promise<Session | null>, []>();

type TestFunction = (key: string) => string;
const getTranslationsMock = jest.fn<Promise<TestFunction>, [string]>();

const getOrganizationUsersMock = jest.fn<Promise<UserDetail[]>, [string, string]>();
const getUserOrganizationsMock = jest.fn<Promise<Organization[]>, [string, string]>();
const getOrganizationRolesMock = jest.fn<Promise<UserRole[]>, [string, string]>();

jest.mock("src/services/auth/session", () => ({
  getSession: () => getSessionMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: (ns: string) => getTranslationsMock(ns),
}));

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationUsers: (token: string, orgId: string) =>
    getOrganizationUsersMock(token, orgId),
  getUserOrganizations: (token: string, userId: string) =>
    getUserOrganizationsMock(token, userId),
  getOrganizationRoles: (token: string, orgId: string) =>
    getOrganizationRolesMock(token, orgId),
}));

jest.mock("src/components/manage-users/ManageUsersTables", () => ({
  ManageUsersTables: ({
    organizationId,
    activeUsers,
  }: {
    organizationId: string;
    activeUsers: UserDetail[];
  }) => (
    <div data-testid="tables" data-org={organizationId} data-activecount={activeUsers.length} />
  ),
}));

jest.mock("src/components/manage-users/PageHeader", () => ({
  PageHeader: ({
    organizationName,
    pageHeader,
  }: {
    organizationName: string;
    pageHeader: string;
  }) => <div data-testid="header">{`${organizationName}::${pageHeader}`}</div>,
}));

describe("ManageUsersPageContent", () => {
beforeEach(() => {
  getTranslationsMock.mockResolvedValue((key: string) => {
    const translation: Record<string, string> = {
      "errors.notLoggedInMessage": "not logged in",
      "errors.fetchError": "fetch error",
      "pageHeading": "Manage Users",
    };
    return translation[key] ?? key;
  });
});

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders an error message when not logged in", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const jsx = await ManageUsersPageContent({ organizationId: "org-1" });
    render(jsx as React.ReactElement);

    expect(screen.getByText(/not logged in/i)).toBeInTheDocument();
  });

  it("renders PageHeader with organization name and shows ManageUsersTables on success", async () => {
    getSessionMock.mockResolvedValue({ token: "t", user_id: "user-123", email: "e" });

    const orgs: Organization[] = [
      {
        organization_id: "org-1",
        sam_gov_entity: {
          legal_business_name: "ACME Corp",
          ebiz_poc_email: "",
          ebiz_poc_first_name: "",
          ebiz_poc_last_name: "",
          expiration_date: "",
          uei: "",
        },
      } as Organization,
    ];
    getUserOrganizationsMock.mockResolvedValue(orgs);


    const users: UserDetail[] = [
      {
        user_id: "U1",
        email: "sam@example.com",
        first_name: "Sam",
        last_name: "Dev",
        roles: [{ role_id: "r1", role_name: "Admin" }],
      } as UserDetail,
    ];
    getOrganizationUsersMock.mockResolvedValue(users);

    const roles: UserRole[] = [{ role_id: "r1", role_name: "Admin", privileges: [] }];
    getOrganizationRolesMock.mockResolvedValue(roles);

    const jsx = await ManageUsersPageContent({ organizationId: "org-1" });
    render(jsx as React.ReactElement);

    // Header shows orgName::pageHeading (mocked PageHeader)
    expect(screen.getByTestId("header")).toHaveTextContent("ACME Corp::Manage Users");

    // Tables rendered with correct org and active user count
    const tables = screen.getByTestId("tables");
    expect(tables).toHaveAttribute("data-org", "org-1");
    expect(tables).toHaveAttribute("data-activecount", "1");

    // Fetchers called as expected
    expect(getOrganizationUsersMock).toHaveBeenCalledWith("t", "org-1");
    expect(getUserOrganizationsMock).toHaveBeenCalledWith("t", "user-123");
    expect(getOrganizationRolesMock).toHaveBeenCalledWith("t", "org-1");
  });

  it("renders a fetch error message when data fetching fails", async () => {
    getSessionMock.mockResolvedValue({ token: "t", user_id: "u" });
    getOrganizationUsersMock.mockRejectedValueOnce(new Error("boom"));

    const jsx = await ManageUsersPageContent({ organizationId: "org-err" });
    render(jsx as React.ReactElement);

    expect(screen.getByText(/fetch error/i)).toBeInTheDocument();
  });
});
