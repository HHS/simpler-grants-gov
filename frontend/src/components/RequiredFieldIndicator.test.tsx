import { render, screen } from "@testing-library/react";

import { RequiredFieldIndicator } from "src/components/RequiredFieldIndicator";

describe("RequiredFieldIndicator", () => {
  it("renders children with required hint styling", () => {
    render(<RequiredFieldIndicator>Required</RequiredFieldIndicator>);

    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByTestId("required-field-indicator")).toHaveClass(
      "usa-hint usa-hint--required",
    );
  });
});
