import { ReadonlyURLSearchParams } from "next/navigation";
import { Response } from "node-fetch";
import Header from "src/components/Header";
import {
  render,
  screen,
  waitFor,
} from "tests/react-utils";

import userEvent from "@testing-library/user-event";

const props = {
  locale: "en",
};

const mockUseUser = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
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

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: () => true,
  }),
}));

jest.mock("src/components/RouteChangeWatcher", () => ({
  RouteChangeWatcher: () => <></>,
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser(),
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
    expect(screen.getByRole("link", { name: /roadmap/i })).toHaveAttribute(
      "href",
      "/roadmap",
    );

    await userEvent.click(menuButton);

    const closeButton = screen.getByRole("button", { name: /close/i });

    expect(closeButton).toBeInTheDocument();
  });

  it("displays expandable government banner", async () => {
    render(<Header />);

    const govBanner = screen.getByRole("button", {
      name: "Here’s how you know",
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
});
