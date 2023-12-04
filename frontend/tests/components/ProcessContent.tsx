import { render, screen } from "@testing-library/react";

import ProcessContent from "src/components/ProcessContent";

describe("Process Content", () => {
  it("Renders without errors", () => {
    render(<ProcessContent />);
    const ProcessH2 = screen.getByRole("heading", {
      level: 2,
      name: /Our open process/i,
    });

    expect(ProcessH2).toBeInTheDocument();
  });
});
