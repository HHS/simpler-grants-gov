import { render, screen } from "@testing-library/react";

import FullWidthAlert from "src/components/FullWidthAlert";

describe("FullWidthAlert", () => {
  it("Renders without errors", () => {
    render(<FullWidthAlert type="success">This is a test</FullWidthAlert>);
    const alert = screen.getByTestId("alert");
    expect(alert).toBeInTheDocument();
  });

  it("Renders children content in a <p> tag", () => {
    render(<FullWidthAlert type="success">This is a test</FullWidthAlert>);
    const alert = screen.getByTestId("alert");
    expect(alert).toHaveTextContent("This is a test");
    expect(alert).toContainHTML("p");
  });

  it("Renders info alert with correct background color", () => {
    render(<FullWidthAlert type="info">This is a test</FullWidthAlert>);
    const alert = screen.getByTestId("gridContainer").parentElement;
    expect(alert).toHaveClass(`bg-cyan-5`);
  });

  it("Renders error alert with correct background color", () => {
    render(<FullWidthAlert type="error">This is a test</FullWidthAlert>);
    const alert = screen.getByTestId("gridContainer").parentElement;
    expect(alert).toHaveClass(`bg-red-warm-10`);
  });

  it("Renders warning alert with correct background color", () => {
    render(<FullWidthAlert type="warning">This is a test</FullWidthAlert>);
    const alert = screen.getByTestId("gridContainer").parentElement;
    expect(alert).toHaveClass(`bg-yellow-5`);
  });
});
