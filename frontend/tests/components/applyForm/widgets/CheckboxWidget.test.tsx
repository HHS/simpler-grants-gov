import { fireEvent, render, screen } from "@testing-library/react";

import CheckboxWidget from "src/components/applyForm/widgets/CheckboxWidget";

const WidgetProps = {
  id: "test",
  schema: {
    title: "I agree",
    description: "Test description",
  },
  value: true,
  required: true,
  options: {},
};

describe("CheckboxWidget", () => {
  it("renders the title and description", () => {
    render(<CheckboxWidget {...WidgetProps} />);
    expect(screen.getByText("I agree")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("sets the correct default value", () => {
    render(<CheckboxWidget {...WidgetProps} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("unchecked when no value", () => {
    const props = { ...WidgetProps, value: false };
    render(<CheckboxWidget {...props} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("handles value changes", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...WidgetProps,
      onChange: mockOnChange,
      updateOnInput: true,
      value: false,
    };

    render(<CheckboxWidget {...props} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it("renders required attribute when necessary", () => {
    render(<CheckboxWidget {...WidgetProps} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeRequired();
  });

  it("disables options when disabled is true", () => {
    const props = { ...WidgetProps, disabled: true };
    render(<CheckboxWidget {...props} />);
    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).toBeDisabled();
  });
});
