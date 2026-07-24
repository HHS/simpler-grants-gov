import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
    expect(input).toHaveClass("overflow-x-auto");
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

  it("calls onChange for multi-digit typing and deletion", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

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

    const input = screen.getByTestId("input-cell-input");

    await user.type(input, "12");
    expect(input).toHaveValue("12");

    await user.clear(input);
    expect(input).toHaveValue("");

    expect(onChange).toHaveBeenNthCalledWith(1, "1");
    expect(onChange).toHaveBeenNthCalledWith(2, "12");
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("renders an input name for form submission", () => {
    render(
      <TableCell
        cell={{
          type: "input",
          definition: "/properties/federal_share",
        }}
        id="input-cell"
        name="federal_share"
        value=""
      />,
    );

    expect(screen.getByTestId("input-cell-input")).toHaveAttribute(
      "name",
      "federal_share",
    );
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

  it("renders disabled input cells as read-only output", () => {
    render(
      <TableCell
        cell={{
          type: "input",
          definition: "/properties/federal_share",
          format: "decimal",
        }}
        disabled
        id="input-cell"
        value={100}
      />,
    );

    expect(screen.queryByTestId("input-cell-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("input-cell-read-only")).toHaveTextContent(
      "100.00",
    );
  });

  it("supports keyboard focus for editable values", async () => {
    render(
      <TableCell
        cell={{
          type: "input",
          definition: "/properties/federal_share",
        }}
        id="input-cell"
        value=""
      />,
    );

    const input = screen.getByTestId("input-cell-input");
    const user = userEvent.setup();

    await user.tab();

    expect(input).toHaveFocus();
  });

  it("renders read-only values with a distinct visual treatment", () => {
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

    expect(screen.getByTestId("read-only-cell-read-only")).toHaveClass(
      "border-base-light",
    );
    expect(screen.getByTestId("read-only-cell-read-only")).toHaveClass(
      "text-wrap",
    );
  });

  it("renders validation errors when cellErrors provided", () => {
    render(
      <TableCell
        cell={{
          type: "input",
          definition: "/properties/federal_share",
        }}
        cellErrors={["Must be greater than zero", "Cannot exceed budget"]}
        id="input-cell-with-errors"
        value="0"
      />,
    );

    const input = screen.getByTestId("input-cell-with-errors-input");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "error-for-input-cell-with-errors",
    );

    // FieldErrors component should render the errors
    expect(screen.getByText("Must be greater than zero")).toBeInTheDocument();
    expect(screen.getByText("Cannot exceed budget")).toBeInTheDocument();
  });

  it("does not set aria-invalid when no cellErrors", () => {
    render(
      <TableCell
        cell={{
          type: "input",
          definition: "/properties/federal_share",
        }}
        cellErrors={[]}
        id="input-cell-no-errors"
        value="100"
      />,
    );

    const input = screen.getByTestId("input-cell-no-errors-input");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("defaults to no cellErrors when prop not provided", () => {
    render(
      <TableCell
        cell={{
          type: "input",
          definition: "/properties/federal_share",
        }}
        id="input-cell-default"
        value="50"
      />,
    );

    const input = screen.getByTestId("input-cell-default-input");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAttribute("aria-describedby");
  });
});
