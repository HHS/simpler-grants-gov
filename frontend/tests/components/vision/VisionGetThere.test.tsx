import { render, screen } from "tests/react-utils";

import VisionGetThere from "src/components/vision/sections/VisionGetThere";

describe("Vision Get There Content", () => {
  it("Renders without errors", () => {
    render(<VisionGetThere />);
    const ProcessH1 = screen.getByRole("heading", {
      // level: 2,
      name: "How we get there",
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
