import { render, screen } from "@testing-library/react";
import VisionGoals from "src/app/[locale]/(base)/vision/_components/sections/VisionGoals";

describe("Vision Goals Content", () => {
  it("Renders without errors", () => {
    render(<VisionGoals />);
    const ProcessH1 = screen.getByRole("heading", {
      name: "title",
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
