import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import React from "react";

import Snackbar from "src/components/Snackbar";

describe("Snackbar Component", () => {
  test("renders with correct attributes", () => {
    render(<Snackbar isVisible={true}>test</Snackbar>);
    const snackbar = screen.getByTestId("snackbar");
    expect(snackbar).toHaveTextContent("test");
    expect(snackbar).toHaveClass("is-visible");
  });

  test("renders with correct invisible attribute", () => {
    render(<Snackbar isVisible={false}>test</Snackbar>);
    const snackbar = screen.getByTestId("snackbar");
    expect(snackbar).toHaveClass("is-hidden");
  });

  it("should not have basic accessibility issues", async () => {
    const { container } = render(<Snackbar isVisible={true}>test</Snackbar>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
