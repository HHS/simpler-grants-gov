import { render, screen } from "@testing-library/react";

import TextAreaWidget from "src/components/applyForm/widgets/TextAreaWidget";

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

describe("TextAreaWidget", () => {
  it("renders the value content and title", () => {
    render(<TextAreaWidget {...WidgetProps} />);
    expect(screen.getByDisplayValue("already entered")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("renders required", () => {
    const props = { ...WidgetProps, required: true };
    render(<TextAreaWidget {...props} />);
    expect(screen.getByDisplayValue("already entered")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("renders with minLength and maxLength attributes", () => {
    render(<TextAreaWidget {...WidgetProps} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("minLength", "1");
    expect(input).toHaveAttribute("maxLength", "10");
  });

  it("ignores onChange event", () => {
    const mockOnChange = jest.fn();
    const props = { ...WidgetProps, onChange: mockOnChange };
    render(<TextAreaWidget {...props} />);
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
    render(<TextAreaWidget {...props} />);
    const input = screen.getByRole("textbox");
    input.focus();
    input.blur();
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
