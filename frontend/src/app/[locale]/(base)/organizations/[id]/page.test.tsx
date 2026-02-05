import { render, screen } from "@testing-library/react";
import {
  buildSessionUser,
  type GetSession,
} from "src/test/fixtures/sessionUser";
import { expectFeatureFlagWiring } from "src/test/harness/featureFlagHarness";
import { loadPageWithFeatureFlagHarness } from "src/test/helpers/loadPageWithFeatureFlagHarness";
import type { Organization } from "src/types/applicationResponseTypes";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import React from "react";

type Params = { locale: string };

const ORGANIZATIONS_PAGE_MODULE_PATH =
  "src/app/[locale]/(base)/organizations/page";

describe("Organizations page feature flag wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function registerCommonMocks(options: {
    redirectMock: jest.Mock<void, [string]>;
    authenticationMock: jest.MockedFunction<GetSession>;
    organizationsMock: jest.Mock<Promise<Organization[]>, []>;
  }): void {
    jest.doMock("next-intl/server", () => ({
      setRequestLocale: (_locale: string) => undefined,
    }));

    jest.doMock("next-intl", () => ({
      useTranslations: () => (key: string) => key,
    }));

    jest.doMock("src/services/auth/session", () => ({
      getSession: () => options.authenticationMock(),
    }));

    jest.doMock("src/services/fetch/fetchers/userFetcher", () => ({
      getUserPrivileges: () => Promise.resolve({}),
    }));

    jest.doMock("src/services/fetch/fetchers/organizationsFetcher", () => ({
      getUserOrganizations: () => options.organizationsMock(),
    }));

    jest.doMock("src/components/workspace/UserOrganizationsList", () => ({
      UserOrganizationsList: () => <div data-testid="user-org-list" />,
    }));

    jest.doMock("next/navigation", () => ({
      redirect: (location: string) => options.redirectMock(location),
    }));

    jest.doMock("src/components/user/AuthenticationGate", () => ({
      AuthenticationGate: ({ children }: { children: React.ReactNode }) =>
        children,
    }));
  }

  async function renderOrganizationsPage(options: {
    featureFlagMode: "flagDisabled" | "flagEnabled";
    authenticationMock: jest.MockedFunction<GetSession>;
    organizationsMock: jest.Mock<Promise<Organization[]>, []>;
    redirectMock: jest.Mock<void, [string]>;
  }): Promise<{
    featureFlagHarness: ReturnType<
      typeof loadPageWithFeatureFlagHarness<Params>
    >["featureFlagHarness"];
  }> {
    registerCommonMocks(options);

    const { pageModule, featureFlagHarness } =
      loadPageWithFeatureFlagHarness<Params>(
        ORGANIZATIONS_PAGE_MODULE_PATH,
        options.featureFlagMode,
      );

    const component = await pageModule.default({
      params: Promise.resolve({ locale: "en" }),
    });

    render(component);

    return { featureFlagHarness };
  }

  it("redirects to maintenance if manageUsersOff is enabled", async () => {
    const redirectMock = jest.fn<void, [string]>();

    const sessionUser = buildSessionUser({ token: "fake-token" });
    const authenticationMock: jest.MockedFunction<GetSession> = jest
      .fn()
      .mockResolvedValue(sessionUser);

    const organizationsMock = jest
      .fn<Promise<Organization[]>, []>()
      .mockResolvedValue([]);

    const { featureFlagHarness } = await renderOrganizationsPage({
      featureFlagMode: "flagEnabled",
      authenticationMock,
      organizationsMock,
      redirectMock,
    });

    expectFeatureFlagWiring(featureFlagHarness, "manageUsersOff");

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/maintenance");
  });

  it("the happy path page should have a table and heading", async () => {
    const redirectMock = jest.fn<void, [string]>();

    const sessionUser = buildSessionUser({ token: "fake-token" });
    const authenticationMock: jest.MockedFunction<GetSession> = jest
      .fn()
      .mockResolvedValue(sessionUser);

    const organizationsMock = jest
      .fn<Promise<Organization[]>, []>()
      .mockResolvedValue([]);

    await renderOrganizationsPage({
      featureFlagMode: "flagDisabled",
      authenticationMock,
      organizationsMock,
      redirectMock,
    });

    expect(await screen.findByText("pageTitle")).toBeVisible();
    expect(await screen.findByTestId("user-org-list")).toBeVisible();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("errors fetching data show an error message", async () => {
    const redirectMock = jest.fn<void, [string]>();

    const sessionUser = buildSessionUser({ token: "fake-token" });
    const authenticationMock: jest.MockedFunction<GetSession> = jest
      .fn()
      .mockResolvedValue(sessionUser);

    const organizationsMock = jest
      .fn<Promise<Organization[]>, []>()
      .mockRejectedValue(new Error("failure"));

    await renderOrganizationsPage({
      featureFlagMode: "flagDisabled",
      authenticationMock,
      organizationsMock,
      redirectMock,
    });

    expect(await screen.findByTestId("alert")).toBeVisible();
    expect(await screen.findByText("errorMessage")).toBeVisible();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("unauthenticated users throw an error", async () => {
    const redirectMock = jest.fn<void, [string]>();

    const authenticationMock: jest.MockedFunction<GetSession> = jest
      .fn()
      .mockResolvedValue(null);

    const organizationsMock = jest
      .fn<Promise<Organization[]>, []>()
      .mockResolvedValue([]);

    registerCommonMocks({
      redirectMock,
      authenticationMock,
      organizationsMock,
    });

    const { pageModule } = loadPageWithFeatureFlagHarness<Params>(
      ORGANIZATIONS_PAGE_MODULE_PATH,
      "flagDisabled",
    );

    const error = await wrapForExpectedError(() =>
      pageModule.default({ params: Promise.resolve({ locale: "en" }) }),
    );

    expect(error).toBeInstanceOf(Error);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
