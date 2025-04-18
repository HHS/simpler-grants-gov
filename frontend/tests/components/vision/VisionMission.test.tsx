import { render, screen } from "tests/react-utils";

import VisionMission from "src/components/vision/sections/VisionMission";

describe("Vision Mission Content", () => {
  it("Renders without errors", () => {
    render(<VisionMission />);
    const ProcessH1 = screen.getByRole("heading", {
      name: "Our mission",
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
