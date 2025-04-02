import VisionGetThere from "src/app/[locale]/vision/VisionGetThere";
import { render, screen } from "tests/react-utils";

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
