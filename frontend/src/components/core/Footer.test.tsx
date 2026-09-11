import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";

import Footer from "src/components/core/Footer";

describe("Footer", () => {
  it("Renders without errors", () => {
    render(<Footer />);
    const footer = screen.getByTestId("footer");
    expect(footer).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Footer />);
    const results = await waitFor(() => axe(container));
    expect(results).toHaveNoViolations();
  });
});
