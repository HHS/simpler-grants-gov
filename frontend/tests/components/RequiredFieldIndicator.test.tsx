import { render, screen } from "@testing-library/react";

import { RequiredFieldIndicator } from "src/components/RequiredFieldIndicator";

describe("RequiredFieldIndicator", () => {
  it("matches snapshot", () => {
    const { container } = render(
      <RequiredFieldIndicator>hi</RequiredFieldIndicator>,
    );
    expect(container).toMatchSnapshot();
  });
  it("returns children wrapped in USWDS required classes", () => {
    render(<RequiredFieldIndicator>hi</RequiredFieldIndicator>);
    expect(screen.getByText("hi")).toBeInTheDocument();
    expect(screen.getByTestId("required-field-indicator")).toHaveClass(
      "usa-hint usa-hint--required",
    );
  });
});
