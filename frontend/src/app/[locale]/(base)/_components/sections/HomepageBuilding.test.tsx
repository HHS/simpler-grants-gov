import { render, screen } from "@testing-library/react";

import HomepageBuilding from "./HomepageBuilding";

describe("Homepage Building Content", () => {
  it("Renders without errors", () => {
    render(<HomepageBuilding />);
    const component = screen.getByTestId("homepage-building");

    expect(component).toBeInTheDocument();
  });
});
