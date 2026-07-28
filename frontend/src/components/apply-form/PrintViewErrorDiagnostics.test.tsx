import { render, screen } from "@testing-library/react";
import { messages } from "src/i18n/messages/en";

import PrintViewErrorDiagnostics from "src/components/apply-form/PrintViewErrorDiagnostics";

describe("PrintViewErrorDiagnostics", () => {
  const defaultProperties = {
    applicationId: "application-123",
    applicationFormId: "application-form-456",
    errorCategory: "UnknownError" as const,
    hasInternalToken: true,
  };

  it("renders the unknown category when form data is unavailable without a known getFormData error", () => {
    render(<PrintViewErrorDiagnostics {...defaultProperties} />);

    expect(
      screen.getByRole("heading", { name: "heading" }),
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
    expect(screen.getByText("yes")).toBeInTheDocument();
  });

  it("uses the standard Grants.gov Support Center messages", () => {
    render(<PrintViewErrorDiagnostics {...defaultProperties} />);

    expect(screen.getByText("supportInstructions")).toBeInTheDocument();
    expect(screen.getByText("supportCenterHeading")).toBeInTheDocument();
    expect(screen.getByText("supportAvailability")).toBeInTheDocument();
    expect(screen.getByText("supportEmail")).toBeInTheDocument();
    expect(screen.getByText("supportUnitedStatesPhone")).toBeInTheDocument();
    expect(screen.getByText("supportInternationalPhone")).toBeInTheDocument();

    expect(messages.PrintViewErrorDiagnostics).toMatchObject({
      supportInstructions:
        "Please contact the support team and include the diagnostic details below.",
      supportCenterHeading: "Grants.gov Support Center",
      supportAvailability:
        "We are available 24 hours a day 7 days a week excluding federal holidays.",
      supportEmail: "support@grants.gov",
      supportUnitedStatesPhone: "1-800-518-4726 (U.S.)",
      supportInternationalPhone: "1-606-545-5035 (International)",
    });
  });

  it.each([
    { hasInternalToken: true, expectedDisplayValue: "yes" },
    { hasInternalToken: false, expectedDisplayValue: "no" },
  ])(
    "renders token presence as $expectedDisplayValue when hasInternalToken is $hasInternalToken",
    ({ hasInternalToken, expectedDisplayValue }) => {
      render(
        <PrintViewErrorDiagnostics
          {...defaultProperties}
          hasInternalToken={hasInternalToken}
        />,
      );

      expect(screen.getByText("internalTokenPresentLabel")).toBeInTheDocument();
      expect(screen.getByText(expectedDisplayValue)).toBeInTheDocument();
    },
  );
});
