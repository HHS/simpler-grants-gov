import { render, screen } from "tests/react-utils";

import RoadmapHeader from "src/components/roadmap/sections/RoadmapHeader";

describe("RoadmapHeader Content", () => {
  it("Renders with expected header", () => {
    render(<RoadmapHeader />);
    const RoadmapH1 = screen.getByRole("heading", {
      level: 1,
      name: /Product roadmap?/i,
    });

    expect(RoadmapH1).toBeInTheDocument();
  });
});
