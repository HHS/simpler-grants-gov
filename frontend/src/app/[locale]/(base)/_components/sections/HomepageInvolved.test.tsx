import { render, screen } from "@testing-library/react";

import HomepageInvolved from "./HomepageInvolved";

describe("Homepage Involved Content", () => {
  it("Renders without errors", () => {
    render(<HomepageInvolved />);
    const component = screen.getByTestId("homepage-involved");

    expect(component).toBeInTheDocument();
  });
});
