import { render, screen } from "@testing-library/react";

import NofoImageLink from "src/components/NofoImageLink";

describe("PdfContainer", () => {
  it("Renders landscape without errors", () => {
    render(
      <NofoImageLink
        file="/test/file.pdf"
        image="/test/image.png"
        alt="test alt content"
        height={100}
        width={200}
      />,
    );
    const alt = screen.getByAltText("test alt content");
    expect(alt).toBeInTheDocument();
  });

  it("Renders portrait without errors", () => {
    render(
      <NofoImageLink
        file="/test/file.pdf"
        image="/test/image.png"
        alt="test alt content"
        height={200}
        width={100}
      />,
    );
    const alt = screen.getByAltText("test alt content");
    expect(alt).toBeInTheDocument();
  });
});
