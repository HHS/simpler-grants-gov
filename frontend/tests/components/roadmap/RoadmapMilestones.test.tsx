import RoadmapMilestones from "src/app/[locale]/roadmap/RoadmapMilestones";
import { render, screen } from "tests/react-utils";

describe("RoadmapMilestones Content", () => {
  it("Renders with expected header", () => {
    render(<RoadmapMilestones />);
    const RoadmapMilestonesH2 = screen.getByRole("heading", {
      level: 2,
      name: /Recent milestones reached?/i,
    });

    expect(RoadmapMilestonesH2).toBeInTheDocument();
  });
});
