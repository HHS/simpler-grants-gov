import { render, screen } from "@testing-library/react";

import { RequiredFieldIndicator } from "src/components/RequiredFieldIndicator";

describe("RequiredFieldIndicator", () => {
  it("returns children wrapped in USWDS required classes", () => {
    render(<RequiredFieldIndicator>hi</RequiredFieldIndicator>);
    expect(screen.getByText("hi")).toBeInTheDocument();
    expect(screen.getByTestId("required-field-indicator")).toHaveClass(
      "usa-hint usa-hint--required",
    );
  });
});
