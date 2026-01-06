import React from "react";
import { render, screen, within } from "tests/react-utils";
import Header from "./Header";

jest.mock("./RouteChangeWatcher", () => ({
  __esModule: true,
  RouteChangeWatcher: () => null,
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => ({
    user: { token: "fake-token" },
    hasBeenLoggedOut: false,
    resetHasBeenLoggedOut: jest.fn(),
    refreshIfExpired: jest.fn(),
    logoutLocalUser: jest.fn(),
  }),
}));

const flags = {
  authOn: true,
  savedOpportunitiesOn: true,
  savedSearchesOn: false,
  developerPageOff: false,
  userAdminOff: false,
};

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    featureFlags: flags,
    checkFeatureFlag: (name: string) =>
      Boolean(flags[name as keyof typeof flags]),
  }),
}));

jest.mock("src/hooks/useSnackbar", () => ({
  useSnackbar: () => {
    type SnackbarProps = {
      children: React.ReactNode;
      close: () => void;
      isVisible: boolean;
    };

    const Snackbar = ({ children, isVisible }: SnackbarProps) =>
      isVisible ? <div>{children}</div> : null;

    return {
      showSnackbar: jest.fn(),
      hideSnackbar: jest.fn(),
      snackbarIsVisible: false,
      Snackbar,
    };
  },
}));

describe("Header", () => {
  it("renders primary navigation, logo link, and menu toggle", () => {
    render(<Header />);

    const siteHeader = screen.getByTestId("header");
    const h = within(siteHeader);

    expect(siteHeader).toBeInTheDocument();

    const logoLink = h.getByRole("link", { name: "Simpler.Grants.gov" });
    expect(logoLink).toHaveAttribute("href", "/");
    expect(h.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    expect(h.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(h.getByRole("link", { name: "Search" })).toBeInTheDocument();
    expect(h.getByRole("button", { name: "Workspace" })).toBeInTheDocument();
  });
});
