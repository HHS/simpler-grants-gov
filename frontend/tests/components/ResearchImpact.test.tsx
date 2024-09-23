import ResearchImpact from "src/app/[locale]/research/ResearchImpact";
import { render, screen } from "tests/react-utils";

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
