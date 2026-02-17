import { render, screen } from "@testing-library/react";
import OrganizationsPage from "src/app/[locale]/(base)/organizations/page";
import { Organization } from "src/types/applicationResponseTypes";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { UserDetail } from "src/types/userTypes";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { FunctionComponent, PropsWithChildren, ReactNode } from "react";

type onEnabled = (props: LocalizedPageProps) => ReactNode;

const redirectMock = jest.fn();

const authentication = jest.fn().mockResolvedValue({
  token: "fake-token",
  user_id: "user-1",
});

const organizations = jest.fn().mockResolvedValue([]);

jest.mock("next-intl/server", () => ({
  setRequestLocale: (_locale: string) => undefined,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: () => authentication() as Promise<UserDetail>,
}));

jest.mock("src/services/fetch/fetchers/userFetcher", () => ({
  getUserPrivileges: () => Promise.resolve({}),
}));

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getUserOrganizations: () => organizations() as Promise<Organization[]>,
}));

jest.mock("src/components/workspace/UserOrganizationsList", () => ({
  UserOrganizationsList: () => <div data-testid="user-org-list" />,
}));

jest.mock("next/navigation", () => ({
  redirect: (location: string) => redirectMock(location) as unknown,
}));

jest.mock("src/components/user/AuthenticationGate", () => ({
  AuthenticationGate: ({ children }: PropsWithChildren) => children,
}));

const withFeatureFlagMock = jest
  .fn()
  .mockImplementation(
    (
      WrappedComponent: FunctionComponent<LocalizedPageProps>,
      _featureFlagName,
      _onEnabled,
    ) =>
      (props: { params: Promise<{ locale: string }> }) =>
        WrappedComponent(props) as unknown,
  );

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default:
    (
      WrappedComponent: FunctionComponent<LocalizedPageProps>,
      featureFlagName: string,
      onEnabled: onEnabled,
    ) =>
    (props: LocalizedPageProps) =>
      (
        withFeatureFlagMock as FeatureFlaggedPageWrapper<
          LocalizedPageProps,
          ReactNode
        >
      )(
        WrappedComponent,
        featureFlagName,
        onEnabled,
      )(props) as FunctionComponent<LocalizedPageProps>,
}));

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
    withFeatureFlagMock.mockImplementation(
      (
        WrappedComponent: FunctionComponent<LocalizedPageProps>,
        _featureFlagName: "",
        _onEnabled: () => void,
      ) =>
        (props: { params: Promise<{ locale: string }> }) =>
          WrappedComponent(props) as unknown,
    );
  });

  it("check OrganizationsPage redirects to maintenance if manageUsersOff is enabled", async () => {
    const component = await OrganizationsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(component);

    expect(withFeatureFlagMock).toHaveBeenCalledTimes(1);

    const [wrappedComponent, flagName, onEnabled] = withFeatureFlagMock.mock
      .calls[0] as [
      FunctionComponent<LocalizedPageProps>,
      string,
      (props: LocalizedPageProps) => ReactNode,
    ];

    expect(flagName).toBe("manageUsersOff");
    expect(typeof wrappedComponent).toBe("function");
    expect(typeof onEnabled).toBe("function");

    (onEnabled as () => void)();
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/maintenance");
  });

  it("the happy path page should have a table and heading", async () => {
    const component = await OrganizationsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(component);

    expect(await screen.findByText("pageTitle")).toBeVisible();
    expect(await screen.findByTestId("user-org-list")).toBeVisible();
  });

  it("errors fetching data show an error message", async () => {
    organizations.mockRejectedValue(new Error("failure"));
    const component = await OrganizationsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(component);
    expect(await screen.findByTestId("alert")).toBeVisible();
    expect(await screen.findByText("errorMessage")).toBeVisible();
  });

  it("unauthenticated users throw an error", async () => {
    authentication.mockResolvedValue({
      token: undefined,
      user_id: undefined,
    });

    const error = await wrapForExpectedError(() =>
      OrganizationsPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    );

    expect(error).toBeInstanceOf(Error);
  });
});
