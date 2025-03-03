import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import React from "react";

import Snackbar from "src/components/Snackbar";

describe("Snackbar Component", () => {
  test("renders with correct attributes", () => {
    render(<Snackbar isVisible={true}>test</Snackbar>);
    const snackbar = screen.getByTestId("snackbar");
    expect(snackbar).toBeInTheDocument();
    expect(snackbar).toHaveTextContent("test");
    expect(snackbar).toHaveAttribute("is-visible");
  });
  it("should not have basic accessibility issues", async () => {
    const { container } = render(<Snackbar isVisible={true}>test</Snackbar>);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
