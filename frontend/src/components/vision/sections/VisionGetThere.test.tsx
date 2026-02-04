import { render, screen } from "@testing-library/react";

import VisionGetThere from "src/components/vision/sections/VisionGetThere";

describe("Vision Get There Content", () => {
  it("Renders without errors", () => {
    render(<VisionGetThere />);
    const ProcessH1 = screen.getByRole("heading", {
      name: "title",
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
