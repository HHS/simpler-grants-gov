import { render, screen } from "tests/react-utils";

import { USWDSIcon } from "src/components/USWDSIcon";

describe("USWDSIcon", () => {
  it("Renders without errors", () => {
    render(<USWDSIcon className="usa-icon" name="search" />);
    const icon = screen.getByRole("img", { hidden: true });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("usa-icon");
  });
});
