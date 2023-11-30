import { render, screen } from "@testing-library/react";

import WtGIContent from "src/pages/content/WtGIContent";

describe("Ways to get involved", () => {
  it("Renders without errors", () => {
    render(<WtGIContent />);
    const wtgi = screen.getByTestId("wtgi-content");
    expect(wtgi).toBeInTheDocument();
  });
});
