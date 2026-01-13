import { render, screen } from "tests/react-utils";

import HomepageBuilding from "src/components/homepage/sections/HomepageBuilding";

describe("Homepage Building Content", () => {
  it("Renders without errors", () => {
    render(<HomepageBuilding />);
    const component = screen.getByTestId("homepage-building");

    expect(component).toBeInTheDocument();
  });
});
