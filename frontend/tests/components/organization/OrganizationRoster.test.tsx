import { render, screen } from "@testing-library/react";
import type { UserDetail } from "src/types/userTypes";

import React from "react";

import { OrganizationRoster } from "src/components/organization/OrganizationRoster";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

type Session = { token: string; user_id: string; email: string };
const getSessionMock = jest.fn<Promise<Session | null>, []>();

type TFunction = (key: string) => string;
const getTranslationsServerMock = jest.fn<Promise<TFunction>, [string]>();

const getOrganizationUsersMock = jest.fn<
  Promise<UserDetail[]>,
  [string, string]
>();

jest.mock("src/services/auth/session", () => ({
  getSession: () => getSessionMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: (ns: string) => getTranslationsServerMock(ns),
}));

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationUsers: (token: string, orgId: string) =>
    getOrganizationUsersMock(token, orgId),
}));

describe("OrganizationRoster", () => {
  beforeEach(() => {
    getTranslationsServerMock.mockResolvedValue((key: string) => {
      const dict: Record<string, string> = {
        "headings.email": "Email",
        "headings.name": "Name",
        "headings.roles": "Roles",
        title: "Users",
      };
      return dict[key] ?? key;
    });

    getSessionMock.mockResolvedValue({ token: "t", user_id: "u", email: "e" });

    const users: UserDetail[] = [
      {
        user_id: "u1",
        email: "sam@example.com",
        first_name: "Sam",
        last_name: "Dev",
        roles: [{ role_id: "r1", role_name: "Admin" }],
      } as UserDetail,
    ];
    getOrganizationUsersMock.mockResolvedValue(users);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders a table of users for the organization", async () => {
    const jsx = await OrganizationRoster({ organizationId: "org-1" });
    render(jsx as React.ReactElement);

    expect(
      screen.getByRole("columnheader", { name: /email/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /name/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /roles/i }),
    ).toBeInTheDocument();

    expect(await screen.findByText("sam@example.com")).toBeInTheDocument();
    expect(await screen.findByText("Sam Dev")).toBeInTheDocument();
    expect(await screen.findByText("Admin")).toBeInTheDocument();
  });

  it("shows an error alert when not logged in", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const jsx = await OrganizationRoster({ organizationId: "org-1" });
    render(jsx as React.ReactElement);

    expect(screen.getByText(/not logged in/i)).toBeInTheDocument();
  });
});
