import { render, screen } from "@testing-library/react";

import RoadmapMilestones from "src/components/roadmap/sections/RoadmapMilestones";

describe("RoadmapMilestones Content", () => {
  it("Renders with expected header", () => {
    render(<RoadmapMilestones />);
    const RoadmapMilestonesH2 = screen.getByRole("heading", {
      level: 2,
      name: "title",
    });

    expect(RoadmapMilestonesH2).toBeInTheDocument();
  });
});
