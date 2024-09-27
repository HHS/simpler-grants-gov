import { render, screen } from "tests/react-utils";

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

  it("Renders info alert", () => {
    render(<FullWidthAlert type="info">This is a test</FullWidthAlert>);
    const alert = screen.getByTestId("alert");
    expect(alert).toBeInTheDocument();
  });

  it("Renders error alert", () => {
    render(<FullWidthAlert type="error">This is a test</FullWidthAlert>);
    const alert = screen.getByTestId("alert");
    expect(alert).toBeInTheDocument();
  });

  it("Renders warning alert", () => {
    render(<FullWidthAlert type="warning">This is a test</FullWidthAlert>);
    const alert = screen.getByTestId("alert");
    expect(alert).toBeInTheDocument();
  });
});
