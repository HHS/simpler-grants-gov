import { render, screen } from "@testing-library/react";

import TextWidget from "src/components/applyForm/widgets/TextWidget";

const WidgetProps = {
  id: "test",
  schema: {
    title: "test",
    maxLength: 10,
    minLength: 1,
    default: "already entered",
    type: "string" as const,
  },
  updateOnInput: false,
  value: "already entered",
  required: undefined,
  options: {},
};

describe("TextWidget", () => {
  it("renders the value content and title", () => {
    render(<TextWidget {...WidgetProps} />);
    expect(screen.getByDisplayValue("already entered")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("renders required", () => {
    const props = { ...WidgetProps, required: true };
    render(<TextWidget {...props} />);
    expect(screen.getByDisplayValue("already entered")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("renders with minLength and maxLength attributes", () => {
    render(<TextWidget {...WidgetProps} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("minLength", "1");
    expect(input).toHaveAttribute("maxLength", "10");
  });

  it("renders with correct input type", () => {
    const props = {
      ...WidgetProps,
      schema: { ...WidgetProps.schema, format: "email" },
    };
    render(<TextWidget {...props} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "email");
  });

  it("renders datalist when examples are provided", () => {
    const props = {
      ...WidgetProps,
      schema: { ...WidgetProps.schema, examples: ["example1", "example2"] },
    };
    render(<TextWidget {...props} />);
    const input = screen.getByTestId("test");
    const datalistId = input.getAttribute("list");
    expect(datalistId).toBeTruthy();
  });

  it("ignores onChange event", () => {
    const mockOnChange = jest.fn();
    const props = { ...WidgetProps, onChange: mockOnChange };
    render(<TextWidget {...props} />);
    const input = screen.getByRole("textbox");
    input.focus();
    input.blur();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("handles onChange event", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...WidgetProps,
      onChange: mockOnChange,
      updateOnInput: true,
    };
    render(<TextWidget {...props} />);
    const input = screen.getByRole("textbox");
    input.focus();
    input.blur();
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
