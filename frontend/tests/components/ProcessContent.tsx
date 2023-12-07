import { render, screen } from "@testing-library/react";
import ProcessContent from "src/pages/content/ProcessContent";

describe("Process Content", () => {
  it("Renders without errors", () => {
    render(<ProcessContent />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /Our open process/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
