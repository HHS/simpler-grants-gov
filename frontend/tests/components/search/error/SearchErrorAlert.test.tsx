import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import SearchErrorAlert from "src/components/search/error/SearchErrorAlert";

describe("SearchErrorAlert", () => {
  it("should display the error message", () => {
    render(<SearchErrorAlert />);
    expect(screen.getByText("We're sorry.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "There seems to have been an error. Please try your search again.",
      ),
    ).toBeInTheDocument();
  });

  it("should not have any accessibility violations", async () => {
    const { container } = render(<SearchErrorAlert />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
