import { render, screen } from "@testing-library/react";
import ProcessContent from "src/pages/content/IndexProcessContent";

describe("Process Content", () => {
  it("Renders without errors", () => {
    render(<ProcessContent />);
    const processH2 = screen.getByRole("heading", {
      level: 2,
      name: /The process?/i,
    });

    expect(processH2).toBeInTheDocument();
  });
});
