import { render, screen } from "@testing-library/react";
import { ExternalRoutes } from "src/constants/routes";

import Footer from "src/components/Footer";

const footer_strings = {
  agency_name: "Grants.gov",
  agency_contact_center: "Grants.gov Program Management Office",
  telephone: "1-877-696-6775",
  return_to_top: "Return to top",
  link_twitter: "Twitter",
  link_youtube: "YouTube",
  link_github: "Github",
  link_rss: "RSS",
  link_newsletter: "Newsletter",
  link_blog: "Blog",
  logo_alt: "Grants.gov logo",
};

describe("Footer", () => {
  it("Renders without errors", () => {
    render(<Footer footer_strings={footer_strings} />);
    const footer = screen.getByTestId("footer");
    expect(footer).toBeInTheDocument();
  });

  it("Renders social links", () => {
    render(<Footer footer_strings={footer_strings} />);

    const twitter = screen.getByTitle("Twitter");
    const youtube = screen.getByTitle("YouTube");
    const github = screen.getByTitle("Github");
    const rss = screen.getByTitle("RSS");
    const newsletter = screen.getByTitle("Newsletter");
    const blog = screen.getByTitle("Blog");

    expect(twitter).toBeInTheDocument();
    expect(twitter).toHaveAttribute("href", ExternalRoutes.GRANTS_TWITTER);

    expect(youtube).toBeInTheDocument();
    expect(youtube).toHaveAttribute("href", ExternalRoutes.GRANTS_YOUTUBE);

    expect(github).toBeInTheDocument();
    expect(github).toHaveAttribute("href", ExternalRoutes.GITHUB_REPO);

    expect(rss).toBeInTheDocument();
    expect(rss).toHaveAttribute("href", ExternalRoutes.GRANTS_RSS);

    expect(newsletter).toBeInTheDocument();
    expect(newsletter).toHaveAttribute(
      "href",
      ExternalRoutes.GRANTS_NEWSLETTER,
    );

    expect(blog).toBeInTheDocument();
    expect(blog).toHaveAttribute("href", ExternalRoutes.GRANTS_BLOG);
  });
});
