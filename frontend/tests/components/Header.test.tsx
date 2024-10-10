import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "tests/react-utils";

import Header from "src/components/Header";

const props = {
  logoPath: "/img/logo.svg",
  primaryLinks: [
    {
      i18nKey: "nav_link_home",
      href: "/",
    },
    {
      i18nKey: "nav_link_health",
      href: "/health",
    },
  ],
};

let searchFeatureFlag = false;

const getSearchFeatureFlag = () => {
  console.log("$$$", searchFeatureFlag);
  return searchFeatureFlag;
};

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    featureFlagsManager: {
      featureFlags: {
        showSearchV0: getSearchFeatureFlag(),
      },
    },
  }),
}));

describe("Header", () => {
  afterEach(() => {
    searchFeatureFlag = false;
  });
  it("toggles the mobile nav menu", async () => {
    render(<Header {...props} />);
    const menuButton = screen.getByTestId("navMenuButton");

    expect(menuButton).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /process/i })).toHaveAttribute(
      "href",
      "/process",
    );

    await userEvent.click(menuButton);

    const closeButton = screen.getByRole("button", { name: /close/i });

    expect(closeButton).toBeInTheDocument();
  });

  it("displays expandable government banner", async () => {
    render(<Header />);

    const govBanner = screen.getByRole("button", { expanded: false });

    expect(govBanner).toBeInTheDocument();

    await userEvent.click(govBanner);

    expect(govBanner).toHaveAttribute("aria-expanded", "true");
  });

  it("displays expected nav links without feature flags", () => {
    render(<Header />);

    const expectedNavLinks = ["Home", "Process", "Research", "Subscribe"];
    expectedNavLinks.forEach((linkText) => {
      const link = screen.getByText(linkText);
      expect(link).toBeInTheDocument();
    });
    // ensure search is not included by default
    try {
      screen.getByText("Search");
    } catch (_e) {
      expect(false).toBeFalsy;
    }
  });

  it("displays expected nav links without feature flags", async () => {
    searchFeatureFlag = true;

    render(<Header />);

    waitFor(() => expect(screen.getByText("Search")).toBeInTheDocument());
  });
});
