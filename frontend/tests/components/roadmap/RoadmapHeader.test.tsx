import RoadmapHeader from "src/app/[locale]/roadmap/RoadmapHeader";
import { render, screen } from "tests/react-utils";

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
