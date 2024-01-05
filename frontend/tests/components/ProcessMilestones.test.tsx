import { render, screen } from "@testing-library/react";
import ProcessMilestones from "src/pages/content/ProcessMilestones";

describe("Process Content", () => {
  it("Renders without errors", () => {
    render(<ProcessMilestones />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /The high-level roadmap/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
