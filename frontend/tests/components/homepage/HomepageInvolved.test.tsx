import { render, screen } from "tests/react-utils";

import HomepageInvolved from "src/components/homepage/sections/HomepageInvolved";

describe("Homepage Involved Content", () => {
  it("matches snapshot", () => {
    const { container } = render(<HomepageInvolved />);
    expect(container).toMatchSnapshot();
  });
  it("Renders without errors", () => {
    render(<HomepageInvolved />);
    const component = screen.getByTestId("homepage-involved");

    expect(component).toBeInTheDocument();
  });
});
