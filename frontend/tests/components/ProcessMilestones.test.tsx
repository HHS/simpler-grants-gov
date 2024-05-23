import { render, screen } from "tests/react-utils";
import ProcessMilestones from "src/app/[locale]/process/ProcessMilestones";

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
