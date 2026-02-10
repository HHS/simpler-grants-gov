import userEvent from "@testing-library/user-event";
import { Response } from "node-fetch";
import { fakeTestUser } from "src/utils/testing/fixtures";
import * as userUtils from "src/utils/userUtils";
import { render, screen, waitFor, within } from "tests/react-utils";

import { ReadonlyURLSearchParams } from "next/navigation";

import Header from "src/components/Header";

const props = {
  locale: "en",
};

const mockUseUser = jest.fn();

const mockShowSnackbar = jest.fn();

const mockUseSnackBar = jest.fn(() => ({
  showSnackbar: () => mockShowSnackbar() as unknown,
  Snackbar: () => <></>,
  hideSnackbar: jest.fn(),
  snackbarIsVisible: true,
}));

const usePathnameMock = jest.fn().mockReturnValue("/fakepath");

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    searchParams: new ReadonlyURLSearchParams(),
  }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock() as string,
  useRouter: () => ({
    refresh: () => undefined,
  }),
}));

const mockCheckFeatureFlag = jest.fn().mockReturnValue(true);

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: (flagName: string) =>
      mockCheckFeatureFlag(flagName) as boolean,
  }),
}));

jest.mock("src/components/RouteChangeWatcher", () => ({
  RouteChangeWatcher: () => <></>,
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: (): unknown => mockUseUser(),
}));

jest.mock("src/hooks/useSnackbar", () => ({
  useSnackbar: () => mockUseSnackBar() as unknown,
}));

jest.mock("src/utils/userUtils", () => ({
  storeCurrentPage: jest.fn(),
}));

describe("Header", () => {
  const mockResponse = {
    auth_login_url: "/login-url",
  } as unknown as Response;

  let originalFetch: typeof global.fetch;
  beforeAll(() => {
    originalFetch = global.fetch;
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    mockUseUser.mockReturnValue({
      user: {
        token: "faketoken",
      },
      hasBeenLoggedOut: false,
      resetHasBeenLoggedOut: jest.fn(),
    });
  });

  it("toggles the mobile nav menu", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      }),
    ) as jest.Mock;

    render(<Header {...props} />);
    const menuButton = screen.getByTestId("navMenuButton");

    expect(menuButton).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /search/i })).toHaveAttribute(
      "href",
      "/search",
    );

    await userEvent.click(menuButton);

    const closeButton = screen.getByRole("button", { name: /close/i });

    expect(closeButton).toBeInTheDocument();
  });

  it("displays expandable government banner", async () => {
    render(<Header />);

    const govBanner = screen.getByRole("button", {
      name: /Here’s how you know/i,
    });

    expect(govBanner).toBeInTheDocument();

    await userEvent.click(govBanner);

    expect(govBanner).toHaveAttribute("aria-expanded", "true");
  });

  it("displays a search link without refresh param if not currently on search page", () => {
    render(<Header />);

    const searchLink = screen.getByRole("link", { name: "Search" });
    expect(searchLink).toBeInTheDocument();
    expect(searchLink).toHaveAttribute("href", "/search");
  });

  it("displays a search link with refresh param if currently on search page", () => {
    usePathnameMock.mockReturnValue("/search");
    render(<Header />);

    const searchLink = screen.getByRole("link", { name: "Search" });
    expect(searchLink).toBeInTheDocument();
    expect(searchLink).toHaveAttribute("href", "/search?refresh=true");
  });

  it("displays a home link if not on home page", () => {
    usePathnameMock.mockReturnValue("/search");
    render(<Header />);

    const homeLink = screen.getByRole("link", { name: "Simpler.Grants.gov" });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("shows the correct styling for active nav item", async () => {
    usePathnameMock.mockReturnValue("/");
    const { rerender } = render(<Header />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveClass("usa-current");

    usePathnameMock.mockReturnValue("/search");
    rerender(<Header />);
    const searchLink = screen.getByRole("link", { name: "Search" });
    expect(searchLink).toHaveClass("usa-current");

    usePathnameMock.mockReturnValue("/es/search");
    rerender(<Header />);
    const spanishLink = screen.getByRole("link", { name: "Search" });
    expect(spanishLink).toHaveClass("usa-current");

    usePathnameMock.mockReturnValue("/es/search?query=hello");
    rerender(<Header />);
    const queryLink = screen.getByRole("link", { name: "Search" });
    expect(queryLink).toHaveClass("usa-current");
    usePathnameMock.mockReturnValue("/opportunity/35");
    rerender(<Header />);
    const allLinks = await screen.findAllByRole("link");
    allLinks.forEach((link) => {
      expect(link).not.toHaveClass("usa-current");
    });
  });

  it("closes an open subnav on the next click", async () => {
    userEvent.setup({ skipHover: true });
    render(<Header {...props} />);

    const workspaceButton = screen.getByRole("button", {
      name: "Workspace",
    });
    expect(workspaceButton).toHaveAttribute("aria-expanded", "false");

    // the submenu assertions are not strictly necessary, but I could not get the timing to work right
    // to get tests to pass correctly without them, so leaving them in
    // eslint-disable-next-line testing-library/no-node-access
    const subMenu = workspaceButton.nextSibling;
    expect(subMenu).not.toBeVisible();

    await userEvent.click(workspaceButton);

    await waitFor(() =>
      expect(workspaceButton).toHaveAttribute("aria-expanded", "true"),
    );
    await waitFor(() => expect(subMenu).toBeVisible());

    const anywhereElse = screen.getByText("Home");
    await userEvent.click(anywhereElse);

    await waitFor(() =>
      expect(workspaceButton).toHaveAttribute("aria-expanded", "false"),
    );
    await waitFor(() => expect(subMenu).not.toBeVisible());
  });

  describe("Workspace", () => {
    it("shows Applications", async () => {
      render(<Header {...props} />);

      const workspaceButton = screen.getByRole("button", {
        name: "Workspace",
      });
      await userEvent.click(workspaceButton);
      const applicationsLink = screen.getByRole("link", {
        name: "Applications",
      });
      expect(applicationsLink).toBeInTheDocument();
      expect(applicationsLink).toHaveAttribute("href", "/applications");
    });
  });

  describe("About", () => {
    it("shows About as the active nav item when on Vision page", () => {
      usePathnameMock.mockReturnValue("/vision");
      render(<Header />);

      const homeLink = screen.getByRole("button", { name: /About/i });
      expect(homeLink).toHaveClass("usa-current");
    });
    it("shows About as the active nav item when on Roadmap page", () => {
      usePathnameMock.mockReturnValue("/roadmap");
      render(<Header />);

      const homeLink = screen.getByRole("button", { name: /About/i });
      expect(homeLink).toHaveClass("usa-current");
    });

    it("renders About submenu", async () => {
      const user = userEvent.setup();
      render(<Header {...props} />);

      expect(
        screen.queryByRole("link", { name: /Our Vision/i }),
      ).not.toBeInTheDocument();

      const aboutBtn = screen.getByRole("button", { name: /About/i });

      await user.click(aboutBtn);

      expect(aboutBtn).toHaveAttribute("aria-expanded", "true");

      const visionLink = screen.getByRole("link", { name: /Our Vision/i });
      expect(visionLink).toBeInTheDocument();
    });
    it("renders Community submenu", async () => {
      const user = userEvent.setup();
      render(<Header {...props} />);

      expect(
        screen.queryByRole("link", { name: /Events/i }),
      ).not.toBeInTheDocument();

      const communityBtn = screen.getByRole("button", { name: /Community/i });

      await user.click(communityBtn);

      expect(communityBtn).toHaveAttribute("aria-expanded", "true");

      const eventsLink = screen.getByRole("link", { name: /Events/i });
      expect(eventsLink).toBeInTheDocument();
    });
  });

  it("shows snackbar if user has been logged out", () => {
    mockUseUser.mockReturnValue({
      user: {
        token: "a token",
      },
      hasBeenLoggedOut: true,
      resetHasBeenLoggedOut: jest.fn(),
    });
    render(<Header {...props} />);
    expect(mockShowSnackbar).toHaveBeenCalledTimes(1);
  });
  it("renders test user dropdown when local and test users are present", () => {
    render(<Header localDev={true} testUsers={[fakeTestUser]} />);

    const testUserDropdown = screen.getByRole("combobox");
    expect(testUserDropdown).toBeInTheDocument();
  });
  it("does not render test user dropdown by default", () => {
    render(<Header />);

    const testUserDropdown = screen.queryByRole("combobox");
    expect(testUserDropdown).not.toBeInTheDocument();
  });
  it("closes mobile nav when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<Header {...props} />);
    const menuButton = screen.getByTestId("navMenuButton");
    await user.click(menuButton);
    expect(
      document.querySelector(".usa-overlay.is-visible"),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(
      document.querySelector(".usa-overlay.is-visible"),
    ).not.toBeInTheDocument();
  });
  it("closes mobile nav when overlay is clicked", async () => {
    const user = userEvent.setup();
    render(<Header {...props} />);
    const menuButton = screen.getByTestId("navMenuButton");
    await user.click(menuButton);
    const overlay = document.querySelector(".usa-overlay.is-visible");
    expect(overlay).toBeInTheDocument();

    await user.click(overlay as HTMLElement);

    expect(
      document.querySelector(".usa-overlay.is-visible"),
    ).not.toBeInTheDocument();
  });
  it("calls storeCurrentPage when sign-in is clicked in mobile menu", async () => {
    (userUtils.storeCurrentPage as jest.Mock).mockClear();
    mockUseUser.mockReturnValue({
      user: { token: undefined },
      hasBeenLoggedOut: false,
      resetHasBeenLoggedOut: jest.fn(),
    });
    const user = userEvent.setup();
    render(<Header {...props} />);
    const menuButton = screen.getByTestId("navMenuButton");
    await user.click(menuButton);
    const signInLinks = screen.getAllByRole("link", { name: /sign in/i });
    const mobileSignIn = signInLinks.find((el) =>
      el.getAttribute("class")?.includes("desktop:display-none"),
    );
    expect(mobileSignIn).toBeTruthy();
    const signInLabel = within(mobileSignIn!).getByText("Sign in");
    await user.click(signInLabel);

    expect(userUtils.storeCurrentPage).toHaveBeenCalled();
  });
  it("renders with locale for language selection", () => {
    render(<Header locale="es/" />);
    expect(
      screen.getByRole("button", { name: /Here’s how you know/i }),
    ).toBeInTheDocument();
  });

  describe("Authentication and nav", () => {
    it("shows Sign in as a nav link when user is unauthenticated", () => {
      mockUseUser.mockImplementation(() => ({
        user: {
          token: undefined,
        },
        hasBeenLoggedOut: false,
        resetHasBeenLoggedOut: jest.fn(),
      }));
      render(<Header {...props} />);

      const signInLinks = screen.getAllByRole("link", { name: /sign in/i });
      expect(signInLinks.length).toBeGreaterThanOrEqual(1);
      const navSignInLink = signInLinks.find((el) =>
        el.getAttribute("class")?.includes("desktop:display-none"),
      );
      expect(navSignInLink).toBeInTheDocument();
      expect(navSignInLink).toHaveAttribute(
        "href",
        expect.stringContaining("login"),
      );
    });

    it("applies desktop:display-none to Sign in link in nav when unauthenticated so it is only in the menu on mobile", () => {
      mockUseUser.mockImplementation(() => ({
        user: {
          token: undefined,
        },
        hasBeenLoggedOut: false,
        resetHasBeenLoggedOut: jest.fn(),
      }));
      render(<Header {...props} />);

      const signInLinks = screen.getAllByRole("link", { name: /sign in/i });
      const navSignInLink = signInLinks.find((el) =>
        el.getAttribute("class")?.includes("desktop:display-none"),
      );
      expect(navSignInLink).toHaveClass("desktop:display-none");
    });

    it("shows Account dropdown in nav when user is authenticated", () => {
      mockUseUser.mockReturnValue({
        user: { token: "faketoken" },
        hasBeenLoggedOut: false,
        resetHasBeenLoggedOut: jest.fn(),
      });
      render(<Header {...props} />);

      const accountButton = screen.getByRole("button", { name: /account/i });
      expect(accountButton).toBeInTheDocument();
    });

    it("Account dropdown contains Settings and Sign out when opened", async () => {
      mockUseUser.mockReturnValue({
        user: { token: "faketoken" },
        hasBeenLoggedOut: false,
        resetHasBeenLoggedOut: jest.fn(),
      });
      const user = userEvent.setup();
      render(<Header {...props} />);

      const accountButton = screen.getByRole("button", { name: /account/i });
      await user.click(accountButton);

      expect(accountButton).toHaveAttribute("aria-expanded", "true");
      const settingsLink = screen.getByRole("link", { name: /settings/i });
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveAttribute("href", "/settings");
      expect(screen.getByText(/sign out/i)).toBeInTheDocument();
    });
  });
});
