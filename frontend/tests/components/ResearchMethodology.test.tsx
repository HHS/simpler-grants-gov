import { render, screen } from "@testing-library/react";
import ResearchMethodology from "src/pages/content/ResearchMethodology";

describe("Research Content", () => {
  it("Renders without errors", () => {
    render(<ResearchMethodology />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /The methodology/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
