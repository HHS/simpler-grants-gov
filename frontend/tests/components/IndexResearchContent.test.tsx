import { render, screen } from "@testing-library/react";
import ResearchContent from "src/pages/content/IndexResearchContent";

describe("Research Content", () => {
  it("Renders without errors", () => {
    render(<ResearchContent />);
    const researchH2 = screen.getByRole("heading", {
      level: 2,
      name: /The research?/i,
    });

    expect(researchH2).toBeInTheDocument();
  });
});
