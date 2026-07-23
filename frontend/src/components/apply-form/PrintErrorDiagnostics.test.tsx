import { render, screen } from "@testing-library/react";

import PrintErrorDiagnostics from "src/components/apply-form/PrintErrorDiagnostics";

describe("PrintErrorDiagnostics", () => {
  const defaultProperties = {
    applicationId: "application-123",
    applicationFormId: "application-form-456",
    errorCategory: "TopLevelError" as const,
    hasInternalToken: true,
  };

  it("renders the PDF failure diagnostics with safe values", () => {
    render(<PrintErrorDiagnostics {...defaultProperties} />);

    expect(
      screen.getByRole("heading", { name: "PDF rendering failed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(defaultProperties.applicationId),
    ).toBeInTheDocument();
    expect(
      screen.getByText(defaultProperties.applicationFormId),
    ).toBeInTheDocument();
    expect(
      screen.getByText(defaultProperties.errorCategory),
    ).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it.each([
    { hasInternalToken: true, expectedDisplayValue: "Yes" },
    { hasInternalToken: false, expectedDisplayValue: "No" },
  ])(
    "renders token presence as $expectedDisplayValue when hasInternalToken is $hasInternalToken",
    ({ hasInternalToken, expectedDisplayValue }) => {
      render(
        <PrintErrorDiagnostics
          {...defaultProperties}
          hasInternalToken={hasInternalToken}
        />,
      );

      expect(screen.getByText("Internal token present")).toBeInTheDocument();
      expect(screen.getByText(expectedDisplayValue)).toBeInTheDocument();
    },
  );
});
