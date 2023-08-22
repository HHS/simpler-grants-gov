import { render, screen } from "@testing-library/react";

import WtGIContent from "src/components/WtGIContent";

describe("Hero", () => {
  it("Renders without errors", () => {
    render(<WtGIContent />);
    const wtgi = screen.getByTestId("wtgi-content");
    expect(wtgi).toBeInTheDocument();
  });
});
