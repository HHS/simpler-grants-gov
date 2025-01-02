import { render, screen } from "tests/react-utils";

import GoalContent from "src/components/content/IndexGoalContent";

describe("Goal Content", () => {
  it("Renders without errors", () => {
    render(<GoalContent />);
    const goalH2 = screen.getByRole("heading", {
      level: 3,
      name: /Grant seekers & applicants?/i,
    });

    expect(goalH2).toBeInTheDocument();
  });
});
