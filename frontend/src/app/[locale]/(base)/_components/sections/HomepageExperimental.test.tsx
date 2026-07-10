import { render, screen } from "@testing-library/react";

import HomepageExperimental from "./HomepageExperimental";

describe("Homepage Experimental Content", () => {
  it("Renders without errors", () => {
    render(<HomepageExperimental />);
    const component = screen.getByTestId("homepage-experimental");

    expect(component).toBeInTheDocument();
  });
});
