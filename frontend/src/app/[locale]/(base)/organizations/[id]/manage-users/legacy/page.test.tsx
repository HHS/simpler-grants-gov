import { render } from "@testing-library/react";
import InviteLegacyUsersPage from "src/app/[locale]/(base)/organizations/[id]/manage-users/legacy/page";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { UserDetail } from "src/types/userTypes";

import { FunctionComponent, ReactNode } from "react";

type onEnabled = (props: LocalizedPageProps) => ReactNode;

const redirectMock = jest.fn();

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

jest.mock("next/navigation", () => ({
  redirect: (location: string) => redirectMock(location) as unknown,
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

/*jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
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
*/
describe("InviteLegacyUsersPage page", () => {
  beforeEach(() => {
    // Reset the module graph so the page's top-level withFeatureFlag call
    // re-runs for each test with a fresh mock.
    jest.resetModules();
    jest.clearAllMocks();
    authentication.mockResolvedValue({
      token: "fake-token",
      user_id: "user-1",
    });
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
});
