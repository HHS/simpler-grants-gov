import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { SignOutNavLink, UserDropdown } from "src/components/user/UserControl";

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockLogoutLocalUser = jest.fn();
const mockUseUser = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
  hasBeenLoggedOut: false,
  resetHasBeenLoggedOut: jest.fn(),
  logoutLocalUser: mockLogoutLocalUser,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: () => true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: unknown): unknown => mockPush(url),
    refresh: mockRefresh,
  }),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser(),
}));

describe("UserDropdown", () => {
  it("does not display test application link if not for a test application user", async () => {
    render(<UserDropdown isApplicationTestUser={false} />);

    const menuOpenButton = screen.getByTestId("navDropDownButton");
    await userEvent.click(menuOpenButton);

    expect(
      screen.queryByRole("link", { name: "testApplication" }),
    ).not.toBeInTheDocument();
  });

  it("displays test application link if for a test application user", async () => {
    render(<UserDropdown isApplicationTestUser={true} />);

    const menuOpenButton = screen.getByTestId("navDropDownButton");
    await userEvent.click(menuOpenButton);

    expect(
      screen.getByRole("link", { name: "testApplication" }),
    ).toBeInTheDocument();
  });
});

describe("SignOutNavLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() => Promise.resolve({})) as jest.Mock;
  });

  it("renders Sign out text", () => {
    const onClick = jest.fn();
    render(<SignOutNavLink onClick={onClick} />);

    expect(screen.getByText("logout")).toBeInTheDocument();
  });

  it("calls onClick when clicked after logout", async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(<SignOutNavLink onClick={onClick} />);

    const signOutLabel = screen.getByText("logout");
    await user.click(signOutLabel);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      });
      expect(mockLogoutLocalUser).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
      expect(onClick).toHaveBeenCalled();
    });
  });
});
