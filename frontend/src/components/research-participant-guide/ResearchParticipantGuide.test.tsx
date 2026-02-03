import { render, screen } from "tests/react-utils";

import ResearchParticipantGuide from "src/components/research-participant-guide/ResearchParticipantGuide";

describe("ResearchParticipantGuide Content", () => {
  it("Renders with expected header", () => {
    render(<ResearchParticipantGuide />);
    const IntroParagraph = screen.getByTestId("introParagraph")

    expect(IntroParagraph).toBeInTheDocument();
  });
});
