import { render, screen } from "@testing-library/react";

import ProcessContent from "src/components/ProcessContent";

describe("Process Content", () => {
  it("Renders without errors", () => {
    render(<ProcessContent />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 1,
      name: /Our open process/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
});
