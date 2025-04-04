import VisionMission from "src/app/[locale]/vision/VisionMission";
import { render, screen } from "tests/react-utils";

describe("Vision Mission Content", () => {
  it("Renders without errors", () => {
    render(<VisionMission />);
    const ProcessH1 = screen.getByRole("heading", {
      name: "Our mission",
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
