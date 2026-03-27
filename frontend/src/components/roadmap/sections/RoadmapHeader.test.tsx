import { render, screen } from "@testing-library/react";

import RoadmapHeader from "src/components/roadmap/sections/RoadmapHeader";

describe("RoadmapHeader Content", () => {
  it("Renders with expected header", () => {
    render(<RoadmapHeader />);
    const RoadmapH1 = screen.getByRole("heading", {
      level: 1,
      name: "pageHeaderTitle",
    });

    expect(RoadmapH1).toBeInTheDocument();
  });
});
