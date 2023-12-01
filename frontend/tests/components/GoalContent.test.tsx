import { render, screen } from "@testing-library/react";
import GoalContent from "src/pages/content/IndexGoalContent";

describe("Goal Content", () => {
  it("Renders without errors", () => {
    render(<GoalContent />);
    const goalH2 = screen.getByRole("heading", {
      level: 2,
      name: /What's the goal?/i,
    });

    expect(goalH2).toBeInTheDocument();
  });
});
