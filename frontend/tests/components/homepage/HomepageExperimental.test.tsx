import { render, screen } from "tests/react-utils";

import HomepageExperimental from "src/components/homepage/sections/HomepageExperimental";

describe("Homepage Experimental Content", () => {
  it("matches snapshot", () => {
    const { container } = render(<HomepageExperimental />);
    expect(container).toMatchSnapshot();
  });
  it("Renders without errors", () => {
    render(<HomepageExperimental />);
    const component = screen.getByTestId("homepage-experimental");

    expect(component).toBeInTheDocument();
  });
});
