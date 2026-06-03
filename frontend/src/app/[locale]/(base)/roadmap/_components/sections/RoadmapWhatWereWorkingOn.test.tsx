import { render, screen } from "@testing-library/react";

import RoadmapWhatWereWorkingOn from "./RoadmapWhatWereWorkingOn";

describe("RoadmapWhatWereWorkingOn Content", () => {
  it("Renders with expected header", () => {
    render(<RoadmapWhatWereWorkingOn />);
    const RoadmapWhatWereWorkingOnH2 = screen.getByRole("heading", {
      level: 2,
      name: "title",
    });

    expect(RoadmapWhatWereWorkingOnH2).toBeInTheDocument();
  });
});
