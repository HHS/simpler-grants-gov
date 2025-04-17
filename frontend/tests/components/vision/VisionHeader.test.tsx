import { render, screen } from "tests/react-utils";

import VisionHeader from "src/components/vision/sections/VisionHeader";

describe("Vision Header Content", () => {
  it("Renders without errors", () => {
    render(<VisionHeader />);
    const ProcessH1 = screen.getByRole("heading", {
      // level: 1,
      name: "Our vision",
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
