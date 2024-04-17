import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Header from "src/components/Header";

const header_strings = {
  nav_link_home: "Home",
  nav_link_process: "Process",
  nav_link_research: "Research",
  nav_link_newsletter: "Newsletter",
  nav_menu_toggle: "Menu",
  title: "Simpler.Grants.gov",
};

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
  header_strings,
};

describe("Header", () => {
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
    render(<Header header_strings={header_strings} />);

    const govBanner = screen.getByRole("button", { expanded: false });

    expect(govBanner).toBeInTheDocument();

    await userEvent.click(govBanner);

    expect(govBanner).toHaveAttribute("aria-expanded", "true");
  });
});
