import { render, screen } from "tests/react-utils";

import VisionGoals from "src/components/vision/sections/VisionGoals";

describe("Vision Goals Content", () => {
  it("Renders without errors", () => {
    render(<VisionGoals />);
    const ProcessH1 = screen.getByRole("heading", {
      // level: 2,
      name: "Our goals",
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
