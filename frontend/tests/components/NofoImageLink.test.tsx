import { render, screen } from "@testing-library/react";

import NofoImageLink from "src/components/NofoImageLink";

describe("PdfContainer", () => {
  it("Renders without errors", () => {
    render(
      <NofoImageLink
        file="/test/file.pdf"
        image="/test/image.png"
        alt="test alt content"
      />
    );
    const alt = screen.getByAltText("test alt content");
    expect(alt).toBeInTheDocument();
  });
});
