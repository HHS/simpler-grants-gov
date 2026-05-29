import { render, screen } from "@testing-library/react";
import ResearchParticipantGuide from "src/app/[locale]/(base)/research-participant-guide/_components/ResearchParticipantGuide";

describe("ResearchParticipantGuide Content", () => {
  it("Renders with expected header", () => {
    render(<ResearchParticipantGuide />);
    const IntroParagraph = screen.getByTestId("introParagraph");

    expect(IntroParagraph).toBeInTheDocument();
  });
});
