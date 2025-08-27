import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import RadioWidget from "src/components/applyForm/widgets/RadioWidget";

describe("RadioWidget – string enum", () => {
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

  it("renders the title and radio options", () => {
    render(<RadioWidget {...WidgetProps} />);
    expect(screen.getByText("Choose an option")).toBeInTheDocument();
    expect(screen.getByLabelText("Option 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Option 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Option 3")).toBeInTheDocument();
  });

  it("sets the correct default value (uncontrolled defaultChecked)", () => {
    render(<RadioWidget {...WidgetProps} />);
    const defaultOption = screen.getByLabelText("Option 1") as HTMLInputElement;
    expect(defaultOption).toBeChecked();
  });

  it("handles value changes (emits raw string for string enums)", () => {
    const mockOnChange = jest.fn();
    render(
      <RadioWidget
        {...WidgetProps}
        onChange={mockOnChange}
        updateOnInput={true}
      />,
    );
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
    render(<RadioWidget {...WidgetProps} disabled />);
    expect(screen.getByLabelText("Option 1")).toBeDisabled();
    expect(screen.getByLabelText("Option 2")).toBeDisabled();
    expect(screen.getByLabelText("Option 3")).toBeDisabled();
  });
});

describe("RadioWidget – boolean enum (Yes/No)", () => {
  const BooleanProps = {
    id: "delinquent_federal_debt",
    schema: {
      title: "Delinquent Federal Debt",
      type: "boolean" as const,
    },
    options: {
      enumOptions: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
    },
    required: true,
  };

  function ControlledHarness({
    initial,
    onChange,
  }: {
    initial: boolean;
    onChange?: (v: unknown) => void;
  }) {
    const [value, setValue] = useState<boolean>(initial);

    return (
      <RadioWidget
        {...BooleanProps}
        value={value}
        updateOnInput
        onChange={(next: unknown) => {
          const asBool = next === true || next === "true";
          setValue(asBool);
          onChange?.(asBool);
        }}
      />
    );
  }


  it("renders Yes/No with the correct default selection when value equals true", () => {
    render(<RadioWidget {...BooleanProps} value={true} />);
    const yes = screen.getByLabelText("Yes") as HTMLInputElement;
    const no = screen.getByLabelText("No") as HTMLInputElement;
    expect(yes).toBeChecked();
    expect(no).not.toBeChecked();
  });

  it("emits boolean true/false on change when updateOnInput equals true (controlled)", () => {
    const mockOnChange = jest.fn();
    render(<ControlledHarness initial={false} onChange={mockOnChange} />);

    const yes = screen.getByLabelText("Yes") as HTMLInputElement;
    const no = screen.getByLabelText("No") as HTMLInputElement;

    // Initially false >
    // click Yes >
    // true
    fireEvent.click(yes);
    expect(mockOnChange).toHaveBeenCalledWith(true);
    expect(yes).toBeChecked();
    expect(no).not.toBeChecked();

    // Now value is true >
    // click No >
    // false
    fireEvent.click(no);
    expect(mockOnChange).toHaveBeenCalledWith(false);
    expect(no).toBeChecked();
    expect(yes).not.toBeChecked();
  });

  it("marks radios as required if field is required", () => {
    render(<RadioWidget {...BooleanProps} value={true} />);
    expect(screen.getByLabelText("Yes")).toBeRequired();
    expect(screen.getByLabelText("No")).toBeRequired();
  });
});
