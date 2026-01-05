import { render, screen } from "tests/react-utils";

import RoadmapTimeline from "src/components/roadmap/sections/RoadmapTimeline";

describe("RoadmapTimeline Content", () => {
  it("Renders with expected header", () => {
    render(<RoadmapTimeline />);
    const RoadmapTimelineH2 = screen.getByRole("heading", {
      level: 2,
      name: /Key milestones?/i,
    });

    expect(RoadmapTimelineH2).toBeInTheDocument();
  });
});
