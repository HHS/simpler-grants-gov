import { render, screen } from "@testing-library/react";

import ResearchIntro from "src/components/ResearchIntro";

describe("Research Content", () => {
  it("Renders without errors", () => {
    render(<ResearchIntro />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 1,
      name: /Our existing research/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
