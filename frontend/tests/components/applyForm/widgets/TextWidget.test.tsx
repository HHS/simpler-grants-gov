import { fireEvent, render, screen } from "@testing-library/react";

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

const mockOnChange = jest.fn();

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

  it("renders number input type", async () => {
    const props = {
      ...WidgetProps,
      schema: { ...WidgetProps.schema, type: "number" as const },
    };
    render(<TextWidget {...props} />);
    const input = await screen.findByTestId("test");
    expect(input).toHaveAttribute("type", "number");
  });

  it("renders password input type", async () => {
    const props = {
      ...WidgetProps,
      schema: { ...WidgetProps.schema, format: "password" },
    };
    render(<TextWidget {...props} />);
    const input = await screen.findByTestId("test");
    expect(input).toHaveAttribute("type", "password");
  });

  it("renders date input type", async () => {
    const props = {
      ...WidgetProps,
      schema: { ...WidgetProps.schema, format: "date" },
    };
    render(<TextWidget {...props} />);
    const input = await screen.findByTestId("test");
    expect(input).toHaveAttribute("type", "date");
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

  it("handles onBlur, onFocus events", () => {
    const mockOnBlur = jest.fn();
    const mockOnFocus = jest.fn();
    const props = {
      ...WidgetProps,
      onBlur: mockOnBlur,
      onFocus: mockOnFocus,
      updateOnInput: true,
    };
    render(<TextWidget {...props} />);
    const input = screen.getByRole("textbox");
    input.focus();
    input.blur();
    expect(mockOnBlur).toHaveBeenCalled();
    expect(mockOnFocus).toHaveBeenCalled();
  });

  it("handles onChange event", () => {
    const props = {
      ...WidgetProps,
      onChange: mockOnChange,
      updateOnInput: true,
    };
    render(<TextWidget {...props} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "123" } });
    expect(mockOnChange).toHaveBeenCalled();
  });
});
