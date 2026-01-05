import { render, screen } from "tests/react-utils";
import Footer from "src/components/Footer";
import { ExternalRoutes } from "src/constants/routes";
import { messages } from "src/i18n/messages/en";

describe("Footer", () => {
  it("renders return-to-top link", () => {
    render(<Footer />);
    expect(
      screen.getByRole("link", { name: messages.Footer.returnToTop }),
    ).toHaveAttribute("href", "#");
  });

  it("renders primary navigation links", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: messages.Footer.links.home })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: messages.Footer.links.search })).toHaveAttribute("href", "/search");
    expect(screen.getByRole("link", { name: messages.Footer.links.events })).toHaveAttribute("href", "/events");
    expect(screen.getByRole("link", { name: messages.Footer.links.subscribe })).toHaveAttribute("href", "/subscribe");
  });

  it("renders support email links", () => {
    render(<Footer />);

    const simplerEmailLink = screen.getByRole("link", { name: /simpler@grants\.gov/i });
    expect(simplerEmailLink).toHaveAttribute(
      "href",
      `mailto:${ExternalRoutes.EMAIL_SIMPLERGRANTSGOV}`,
    );

    const supportEmailLink = screen.getByRole("link", { name: /support@grants\.gov/i });
    expect(supportEmailLink).toHaveAttribute(
      "href",
      `mailto:${ExternalRoutes.EMAIL_SUPPORT}`,
    );
  });

  it("renders grantor support external link", () => {
    render(<Footer />);

    const grantorLink = screen.getByRole("link", {
      name: "Agency Point of Contact",
    });

    expect(grantorLink).toHaveAttribute("href", ExternalRoutes.GRANTOR_SUPPORT);
    expect(grantorLink).toHaveAttribute("target", "_blank");
    expect(grantorLink).toHaveAttribute("rel", "noopener noreferrer");
  });

});
