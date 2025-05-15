import { render, screen } from "tests/react-utils";

import RoadmapWhatWereWorkingOn from "src/components/roadmap/sections/RoadmapWhatWereWorkingOn";

describe("RoadmapWhatWereWorkingOn Content", () => {
  it("Renders with expected header", () => {
    render(<RoadmapWhatWereWorkingOn />);
    const RoadmapWhatWereWorkingOnH2 = screen.getByRole("heading", {
      level: 2,
      name: /What we're working on?/i,
    });

    expect(RoadmapWhatWereWorkingOnH2).toBeInTheDocument();
  });
});
