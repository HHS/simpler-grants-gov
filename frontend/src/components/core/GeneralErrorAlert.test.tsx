import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import GeneralErrorAlert from "src/components/core/GeneralErrorAlert";

describe("GeneralErrorAlert", () => {
  it("should display the error message", () => {
    render(<GeneralErrorAlert callToAction="Please try your search again." />);
    expect(screen.getByText("heading")).toBeInTheDocument();
    expect(
      screen.getByText("genericMessage Please try your search again."),
    ).toBeInTheDocument();
  });

  it("should not have any accessibility violations", async () => {
    const { container } = render(<GeneralErrorAlert />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
