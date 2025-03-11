import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import React from "react";

import Snackbar from "src/components/Snackbar";

const close = jest.fn();

describe("Snackbar Component", () => {
  test("renders with correct attributes", () => {
    render(
      <Snackbar close={close} isVisible={true}>
        test
      </Snackbar>,
    );
    const snackbar = screen.getByTestId("snackbar");
    expect(snackbar).toHaveTextContent("test");
    expect(snackbar).toHaveClass("is-visible");
    expect(snackbar).toHaveAttribute("aria-hidden", "false");
  });

  test("renders with correct invisible attribute", () => {
    render(
      <Snackbar close={close} isVisible={false}>
        test
      </Snackbar>,
    );
    const snackbar = screen.getByTestId("snackbar");
    expect(snackbar).toHaveClass("is-hidden");
    expect(snackbar).toHaveAttribute("aria-hidden", "true");
  });

  test("close button works", () => {
    render(
      <Snackbar close={close} isVisible={false}>
        test
      </Snackbar>,
    );
    const snackbarButton = screen.getByTestId("snackbar-close");
    snackbarButton.click();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <Snackbar close={close} isVisible={true}>
        test
      </Snackbar>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
