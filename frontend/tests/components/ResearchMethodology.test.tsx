import ResearchMethodology from "src/app/[locale]/research/ResearchMethodology";
import { render, screen } from "tests/react-utils";

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
