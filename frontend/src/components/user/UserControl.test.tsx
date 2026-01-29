import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SignOutNavLink } from "src/components/user/UserControl";

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
