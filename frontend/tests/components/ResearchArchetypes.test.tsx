import ResearchArchetypes from "src/app/[locale]/research/ResearchArchetypes";
import { render, screen } from "tests/react-utils";

describe("Research Content", () => {
  it("Renders without errors", () => {
    render(<ResearchArchetypes />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /Applicant archetypes/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
