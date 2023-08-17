import { render, screen } from "@testing-library/react";

import PdfContainer from "src/components/PdfContainer";

describe("PdfContainer", () => {
  it("Renders without errors", () => {
    render(<PdfContainer file="/test/file.pdf" image="/test/image.png" alt="test alt content"/>);
    const alt = screen.getByAltText("test alt content");
    expect(alt).toBeInTheDocument();
  });
});
