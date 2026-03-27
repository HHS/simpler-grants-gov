import { render, screen } from "@testing-library/react";

import HomepageHero from "src/components/homepage/sections/HomepageHero";

describe("Homepage Hero Content", () => {
  it("Renders without errors", () => {
    render(<HomepageHero />);
    const component = screen.getByTestId("homepage-hero");

    expect(component).toBeInTheDocument();
  });
});
