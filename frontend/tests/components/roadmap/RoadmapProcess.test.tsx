import { render, screen } from "tests/react-utils";

import RoadmapProcess from "src/components/roadmap/sections/RoadmapProcess";

describe("RoadmapProcess Content", () => {
  it("Renders with expected header", () => {
    render(<RoadmapProcess />);
    const RoadmapProcessH2 = screen.getByRole("heading", {
      level: 2,
      name: /How we work?/i,
    });

    expect(RoadmapProcessH2).toBeInTheDocument();
  });
});
