import { render, screen } from "@testing-library/react";
import ProcessIntro from "src/pages/content/ProcessIntro";

describe("Process Content", () => {
  it("Renders without errors", () => {
    render(<ProcessIntro />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /Our open process/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
