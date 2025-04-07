import { render, screen } from "tests/react-utils";

import ResearchArchetypes from "src/components/research/ResearchArchetypes";

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
