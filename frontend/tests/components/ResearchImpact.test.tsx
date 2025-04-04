import { render, screen } from "tests/react-utils";

import ResearchImpact from "src/components/research/ResearchImpact";

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
