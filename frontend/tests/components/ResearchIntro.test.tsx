import ResearchIntro from "src/app/[locale]/research/ResearchIntro";
import { render, screen } from "tests/react-utils";

describe("Research Content", () => {
  it("Renders without errors", () => {
    render(<ResearchIntro />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /Our existing research/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
