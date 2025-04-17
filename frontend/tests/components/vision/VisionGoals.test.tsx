import VisionGoals from "src/app/[locale]/vision/VisionGoals";
import { render, screen } from "tests/react-utils";

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
