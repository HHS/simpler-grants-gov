import { render, screen } from "@testing-library/react";

import RoadmapProcess from "src/components/roadmap/sections/RoadmapProcess";

describe("RoadmapProcess Content", () => {
  it("Renders with expected header", () => {
    render(<RoadmapProcess />);
    const RoadmapProcessH2 = screen.getByRole("heading", {
      level: 2,
      name: "title",
    });

    expect(RoadmapProcessH2).toBeInTheDocument();
  });
});
