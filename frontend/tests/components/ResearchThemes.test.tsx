import { render, screen } from "tests/react-utils";
import ResearchThemes from "src/app/[locale]/research/ResearchThemes";

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
