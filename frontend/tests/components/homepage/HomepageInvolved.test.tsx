import HomepageInvolved
  from "src/components/homepage/sections/HomepageInvolved";
import {
  render,
  screen,
} from "tests/react-utils";

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