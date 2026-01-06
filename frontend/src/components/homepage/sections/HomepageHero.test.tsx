import { ExternalRoutes } from "src/constants/routes";
import { messages } from "src/i18n/messages/en";
import { render, screen } from "tests/react-utils";

import HomepageHero from "./HomepageHero";

describe("HomepageHero", () => {
  it("renders the main heading and description", () => {
    render(<HomepageHero />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: messages.Homepage.pageTitle,
      }),
    ).toBeInTheDocument();

    const description = screen.getByText((content, node) => {
      return (
        node?.tagName.toLowerCase() === "p" &&
        content.includes(
          "Simpler.Grants.gov is where we are building new features",
        )
      );
    });
    expect(description).toHaveTextContent(
      messages.Homepage.pageDescription.trim(),
    );
  });

  it("links to GitHub", () => {
    render(<HomepageHero />);

    const link = screen.getByRole("link", {
      name: messages.Homepage.githubLink,
    });
    expect(link).toHaveAttribute("href", ExternalRoutes.GITHUB_REPO);
    expect(link).toHaveAttribute("target", "_blank");
  });
});
