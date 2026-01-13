import { render, screen } from "tests/react-utils";

import Footer from "src/components/Footer";

describe("Footer", () => {
  it("Renders without errors", () => {
    render(<Footer />);
    const footer = screen.getByTestId("footer");
    expect(footer).toBeInTheDocument();
  });
});
