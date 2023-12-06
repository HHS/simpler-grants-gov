import { render, screen } from "@testing-library/react";
import ResearchArchetypes from "src/pages/content/ResearchArchetypes";

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
