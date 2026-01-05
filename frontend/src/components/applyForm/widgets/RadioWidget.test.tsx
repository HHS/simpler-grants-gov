import { fireEvent, render, screen } from "@testing-library/react";

import RadioWidget from "src/components/applyForm/widgets/RadioWidget";

const WidgetProps = {
  id: "test",
  schema: {
    title: "Choose an option",
    enum: ["Option 1", "Option 2", "Option 3"],
  },
  value: "Option 1",
  required: true,
  options: {},
};

describe("RadioWidget", () => {
  it("renders the title and radio options", () => {
    render(<RadioWidget {...WidgetProps} />);
    expect(screen.getByText("Choose an option")).toBeInTheDocument();
    expect(screen.getByLabelText("Option 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Option 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Option 3")).toBeInTheDocument();
  });

  it("sets the correct default value", () => {
    render(<RadioWidget {...WidgetProps} />);
    const defaultOption = screen.getByLabelText("Option 1");
    expect(defaultOption).toBeChecked();
  });

  it("handles value changes", () => {
    const mockOnChange = jest.fn();
    const props = {
      ...WidgetProps,
      onChange: mockOnChange,
      updateOnInput: true,
    };

    render(<RadioWidget {...props} />);
    const option2 = screen.getByLabelText("Option 2");
    fireEvent.click(option2);
    expect(mockOnChange).toHaveBeenCalledWith("Option 2");
  });

  it("renders required attribute when necessary", () => {
    render(<RadioWidget {...WidgetProps} />);
    const option1 = screen.getByLabelText("Option 1");
    expect(option1).toBeRequired();
  });

  it("disables options when disabled is true", () => {
    const props = { ...WidgetProps, disabled: true };
    render(<RadioWidget {...props} />);
    expect(screen.getByLabelText("Option 1")).toBeDisabled();
    expect(screen.getByLabelText("Option 2")).toBeDisabled();
    expect(screen.getByLabelText("Option 3")).toBeDisabled();
  });
});
