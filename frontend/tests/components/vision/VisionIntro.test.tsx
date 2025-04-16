import VisionIntro from "src/app/[locale]/vision/VisionIntro";
import { render, screen } from "tests/react-utils";

describe("Vision Intro Content", () => {
  it("Renders without errors", () => {
    render(<VisionIntro />);
    const ProcessH1 = screen.getByRole("heading", {
      // level: 1,
      name: "Our vision",
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
