import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import ServerErrorAlert from "src/components/ServerErrorAlert";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("ServerErrorAlert", () => {
  it("should display the error message", () => {
    render(<ServerErrorAlert callToAction="Please try your search again." />);
    expect(screen.getByText("heading")).toBeInTheDocument();
    expect(
      screen.getByText("generic_message Please try your search again."),
    ).toBeInTheDocument();
  });

  it("should not have any accessibility violations", async () => {
    const { container } = render(<ServerErrorAlert />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
