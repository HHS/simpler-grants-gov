import "@testing-library/jest-dom"; // for custom matchers

import { render, screen } from "@testing-library/react";

import React from "react";

import Spinner from "../../src/components/Spinner";

describe("Spinner Component", () => {
  test("renders with correct attributes", () => {
    render(<Spinner />);

    const spinner = screen.getByRole("progressbar", { name: "Loading!" });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("grants-spinner");
  });

  test("has correct accessibility attributes", () => {
    render(<Spinner />);

    const spinner = screen.getByRole("progressbar", { name: "Loading!" });
    expect(spinner).toHaveAttribute("aria-label", "Loading!");
  });
});
