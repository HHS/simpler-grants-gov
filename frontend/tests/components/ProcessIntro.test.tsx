import { render, screen } from "tests/react-utils";
import ProcessIntro from "src/app/[locale]/process/ProcessIntro";

describe("Process Content", () => {
  it("Renders without errors", () => {
    render(<ProcessIntro />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /Our open process/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
