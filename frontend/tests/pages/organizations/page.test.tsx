import { render, screen, waitFor } from "@testing-library/react";
import { Organization } from "src/types/applicationResponseTypes";
import { UserDetail } from "src/types/userTypes";

import React, { JSX } from "react";

import {
  checkFeatureFlagRedirect,
  getFeatureFlagMockedPage,
} from "../../utils/featureFlagUtils";

jest.mock("next-intl/server", () => ({
  setRequestLocale: (_locale: string) => undefined,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const authentication = jest.fn().mockResolvedValue({
  token: "fake-token",
  user_id: "user-1",
});

jest.mock("src/services/auth/session", () => ({
  getSession: () => authentication() as Promise<UserDetail>,
}));

jest.mock("src/services/fetch/fetchers/userFetcher", () => ({
  getUserPrivileges: () => Promise.resolve({}),
}));

const organizations = jest.fn().mockResolvedValue([]);
jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getUserOrganizations: () => organizations() as Promise<Organization[]>,
}));

jest.mock("src/components/workspace/UserOrganizationsList", () => ({
  UserOrganizationsList: () => <div data-testid="user-org-list" />,
}));

const organizationsPageLocation = "src/app/[locale]/(base)/organizations/page";

describe("Organizations page feature flag wiring", () => {
  beforeEach(() => {
    // Reset the module graph so the page's top-level withFeatureFlag call
    // re-runs for each test with a fresh mock.
    jest.resetModules();
    jest.clearAllMocks();
    authentication.mockResolvedValue({
      token: "fake-token",
      user_id: "user-1",
    });
    organizations.mockResolvedValue([]);
  });

  it("check OrganizationsPage redirects to maintenance if manageUsersOff is enabled", async () => {
    expect(
      await checkFeatureFlagRedirect(
        organizationsPageLocation,
        "manageUsersOff",
        "/maintenance",
      ),
    ).toBe(true);
  });

  it("the happy path page should have a table and heading", async () => {
    const organizationsPage = await getFeatureFlagMockedPage(
      organizationsPageLocation,
    );
    render(organizationsPage);

    expect(await screen.findByText("pageTitle")).toBeVisible();
    expect(await screen.findByTestId("user-org-list")).toBeVisible();
  });

  it("errors fetching data show an error message", async () => {
    organizations.mockRejectedValue(new Error("failure"));
    const organizationsPage = await getFeatureFlagMockedPage(
      organizationsPageLocation,
    );
    render(organizationsPage);

    expect(await screen.findByTestId("alert")).toBeVisible();
    expect(await screen.findByText("errorMessage")).toBeVisible();
  });

  it("unauthenticated users throw an error", async () => {
    authentication.mockResolvedValue({
      token: undefined,
      user_id: undefined,
    });
    await expect(
      getFeatureFlagMockedPage(organizationsPageLocation),
    ).rejects.toThrow();
  });
});
