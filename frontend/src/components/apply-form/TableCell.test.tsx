import { fireEvent, render, screen } from "@testing-library/react";

import TableCell from "./TableCell";

describe("TableCell", () => {
  it("renders plain text content", () => {
    render(
      <TableCell
        cell={{
          type: "plainText",
          staticContent: "Long plain text content",
        }}
        id="plain-text-cell"
      />,
    );

    expect(screen.getByText("Long plain text content")).toBeInTheDocument();
  });

  it("renders a formatted read-only value", () => {
    render(
      <TableCell
        cell={{
          type: "readOnly",
          definition: "/properties/total",
          format: "dollar",
        }}
        id="read-only-cell"
        value={1234.5}
      />,
    );

    expect(screen.getByTestId("read-only-cell-read-only")).toHaveTextContent(
      "$1,234.50",
    );
  });

  it("renders an editable numeric text input", () => {
    render(
      <TableCell
        cell={{
          type: "input",
          definition: "/properties/federal_share",
          format: "decimal",
        }}
        id="input-cell"
        value={1250.5}
      />,
    );

    const input = screen.getByTestId("input-cell-input");

    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(input).toHaveValue("1250.5");
  });

  it("passes valid numeric input changes to onChange", () => {
    const onChange = jest.fn();

    render(
      <TableCell
        cell={{
          type: "input",
          definition: "/properties/federal_share",
        }}
        id="input-cell"
        onChange={onChange}
        value=""
      />,
    );

    fireEvent.change(screen.getByTestId("input-cell-input"), {
      target: { value: "1250.50" },
    });

    expect(onChange).toHaveBeenCalledWith("1250.50");
  });

  it("does not pass invalid numeric input changes to onChange", () => {
    const onChange = jest.fn();

    render(
      <TableCell
        cell={{
          type: "input",
          definition: "/properties/federal_share",
        }}
        id="input-cell"
        onChange={onChange}
        value=""
      />,
    );

    fireEvent.change(screen.getByTestId("input-cell-input"), {
      target: { value: "not-a-number" },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables an editable cell when disabled", () => {
    render(
      <TableCell
        cell={{
          type: "input",
          definition: "/properties/federal_share",
        }}
        disabled
        id="input-cell"
        value={100}
      />,
    );

    expect(screen.getByTestId("input-cell-input")).toBeDisabled();
    expect(screen.getByTestId("input-cell-input")).toHaveClass("width-full");

    expect(screen.getByTestId("read-only-cell-read-only")).toHaveClass(
    "bg-base-lightest",
    );
  });
});
