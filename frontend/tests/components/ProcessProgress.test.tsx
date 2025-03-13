import ProcessProgress from "src/app/[locale]/process/ProcessProgress";
import { render, screen } from "tests/react-utils";

describe("Process Content", () => {
  it("Renders without errors", () => {
    render(<ProcessProgress />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /Recent milestones reached/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
