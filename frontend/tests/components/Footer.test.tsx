import { render, screen } from "@testing-library/react";

import Footer from "src/components/Footer";

describe("Footer", () => {
  it("Renders without errors", () => {
    render(<Footer />);
    const footer = screen.getByTestId("footer");
    expect(footer).toBeInTheDocument();
  });

  it("Renders social links", () => {
    render(<Footer />);

    const twitter = screen.getByTitle("Twitter");
    const youtube = screen.getByTitle("YouTube");
    const rss = screen.getByTitle("RSS");
    const newsletter = screen.getByTitle("Newsletter");
    const blog = screen.getByTitle("Blog");

    expect(twitter).toBeInTheDocument();
    expect(youtube).toBeInTheDocument();
    expect(rss).toBeInTheDocument();
    expect(newsletter).toBeInTheDocument();
    expect(blog).toBeInTheDocument();
  });
});
