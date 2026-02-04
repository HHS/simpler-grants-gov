import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Maintenance from "src/app/[locale]/(base)/maintenance/page";
import { UserContext } from "src/services/auth/useUser";
import { localeParams } from "src/utils/testing/intlMocks";
import { createFakeUserContext } from "src/utils/testing/providerMocks";

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  setRequestLocale: identity,
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

const redirectMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      prefetch: () => null,
    };
  },
  usePathname() {
    return {
      prefetch: () => null,
    };
  },
  push: jest.fn(),
  redirect: (url: string): unknown => redirectMock(url),
  RedirectType: { push: "PUSH" },
}));

describe("Maintenance", () => {
  it("renders intro text", () => {
    // set a major feature offline so we don't redirect to homepage
    render(
      <UserContext value={createFakeUserContext()}>
        <Maintenance params={localeParams} />{" "}
      </UserContext>,
    );
    const content = screen.getByText("heading");

    expect(content).toBeInTheDocument();
  });

  it.skip("redirects when not in maintenance", () => {
    // set a major feature offline so we don't redirect to homepage
    render(
      <UserContext
        value={{
          user: undefined,
          error: undefined,
          isLoading: false,
          refreshUser: function (): Promise<void> {
            throw new Error("Function not implemented.");
          },
          hasBeenLoggedOut: false,
          logoutLocalUser: function (): void {
            throw new Error("Function not implemented.");
          },
          resetHasBeenLoggedOut: function (): void {
            throw new Error("Function not implemented.");
          },
          refreshIfExpired: function (): Promise<boolean | undefined> {
            throw new Error("Function not implemented.");
          },
          refreshIfExpiring: function (): Promise<boolean | undefined> {
            throw new Error("Function not implemented.");
          },
          featureFlags: {
            authOn: true,
            opportunityOff: false,
            searchOff: false,
          },
          userFeatureFlags: {},
          defaultFeatureFlags: {},
        }}
      >
        <Maintenance params={localeParams} />{" "}
      </UserContext>,
    );

    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("passes accessibility scan", async () => {
    const { container } = render(
      <UserContext value={createFakeUserContext()}>
        <Maintenance params={localeParams} />
      </UserContext>,
    );
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
