import { render, screen } from "tests/react-utils";

import ResearchIntro from "src/components/research/ResearchIntro";

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
