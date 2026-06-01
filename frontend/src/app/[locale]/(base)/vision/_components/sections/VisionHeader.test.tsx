import { render, screen } from "@testing-library/react";
import VisionHeader from "src/app/[locale]/(base)/vision/_components/sections/VisionHeader";

describe("Vision Header Content", () => {
  it("Renders without errors", () => {
    render(<VisionHeader />);
    const ProcessH1 = screen.getByRole("heading", {
      name: "pageHeaderTitle",
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
