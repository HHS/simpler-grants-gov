import { render, screen } from "@testing-library/react";
import VisionMission from "src/app/[locale]/(base)/vision/_components/sections/VisionMission";

describe("Vision Mission Content", () => {
  it("Renders without errors", () => {
    render(<VisionMission />);
    const ProcessH1 = screen.getByRole("heading", {
      name: "title",
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
