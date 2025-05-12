import { render, screen } from "tests/react-utils";

import HomepageBuilding from "src/components/homepage/sections/HomepageBuilding";

describe("Homepage Building Content", () => {
  it("matches snapshot", () => {
    const { container } = render(<HomepageBuilding />);
    expect(container).toMatchSnapshot();
  });
  it("Renders without errors", () => {
    render(<HomepageBuilding />);
    const component = screen.getByTestId("homepage-building");

    expect(component).toBeInTheDocument();
  });
});
