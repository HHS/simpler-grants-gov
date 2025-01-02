import ProcessNext from "src/app/[locale]/process/ProcessNext";
import { render, screen } from "tests/react-utils";

describe("Process Content", () => {
  it("Renders without errors", () => {
    render(<ProcessNext />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /What's happening/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
