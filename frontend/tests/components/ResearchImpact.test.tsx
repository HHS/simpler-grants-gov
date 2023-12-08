import { render, screen } from "@testing-library/react";
import ResearchImpact from "src/pages/content/ResearchImpact";

describe("Research Content", () => {
  it("Renders without errors", () => {
    render(<ResearchImpact />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /Where can we have the most impact?/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
