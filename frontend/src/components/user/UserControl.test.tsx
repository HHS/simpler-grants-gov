import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  SignOutNavLink,
  UserControl,
  UserDropdown,
} from "src/components/user/UserControl";

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockLogoutLocalUser = jest.fn();
const mockUseUser = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
  hasBeenLoggedOut: false,
  resetHasBeenLoggedOut: jest.fn(),
<<<<<<< HEAD
  logoutLocalUser: mockLogoutLocalUser,
=======
>>>>>>> 14fced80b (all next 16 upgrade related changes)
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

describe("UserControl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() => Promise.resolve({})) as jest.Mock;
  });

  it("renders LoginButton when user is not authenticated", () => {
    mockUseUser.mockReturnValue({
      user: { token: undefined },
      hasBeenLoggedOut: false,
      resetHasBeenLoggedOut: jest.fn(),
      logoutLocalUser: mockLogoutLocalUser,
    } as unknown as ReturnType<typeof mockUseUser>);
    render(<UserControl localDev={false} />);

    expect(
      screen.getByRole("link", { name: "navLinks.login" }),
    ).toBeInTheDocument();
  });

  it("calls logout and refresh when clicking logout in user dropdown (LogoutNavItem)", async () => {
    mockUseUser.mockReturnValue({
      user: { token: "faketoken" },
      hasBeenLoggedOut: false,
      resetHasBeenLoggedOut: jest.fn(),
      logoutLocalUser: mockLogoutLocalUser,
    });
    const user = userEvent.setup();
    render(<UserControl localDev={false} />);

    const menuButton = screen.getByTestId("navDropDownButton");
    await user.click(menuButton);

    const logoutLink = screen.getByText("logout");
    await user.click(logoutLink);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      });
      expect(mockLogoutLocalUser).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
