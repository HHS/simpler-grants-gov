import { render, screen } from "@testing-library/react";
import ResearchThemes from "src/pages/content/ResearchThemes";

describe("Research Content", () => {
  it("Renders without errors", () => {
    render(<ResearchThemes />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /General themes/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
